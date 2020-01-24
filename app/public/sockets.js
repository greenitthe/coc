//Socket Stuff
socket = io.connect('http://brct.io' + servPort); //the socket communicated on

socket.on('establish', function (data) {
  if (data.port == servPort) {
    console.log("Establishing packet received, port agreement verified, sending acknowledgement...");
    socket.emit('acknowledge', { confirmation: true });
    console.log("Awaiting receipt...");
  }
  else {
    console.log("Establishing packet received, PORTS NOT IN AGREEMENT! ServPort: " + servPort + " | data:");
    console.log(data);
    console.log("Sending error");
    socket.emit('acknowledge', { confirmation: false });
  }
});

socket.on('receipt', function (data) {
  if (data.confirmation) {
    console.log("Connection receipt confirmed by server.");
    checkLoginCookie();
  }
  else {
    console.log("Connection receipt unconfirmed by server.");
  }
});

function updateCharacterData(data) {
  characterData.upgrades=data.upgradesOwned;
  characterData.items=data.itemInventory;
  characterData.currencies=data.currencyBags;
  refreshRegionAndUnblock();
}

//gameData
socket.on('actionResponse', function (data) {
  console.log("Received action response");
  console.log(data);
  updateCharacterData(data);
});

function attemptLogin(username, pass) {
  if (!username || !pass) { console.log("ERROR: ATTEMPTING LOGIN WITH UNDEFINED USER (" + username + ") OR PASS (" + pass + ")! ABORTING"); return; }
  socket.emit('verifyLogin', {username: username, pass: pass});
}

function sendAction(actionName, args) {
  socket.emit('attemptAction', {name: actionName, args: args});
}

// //Receives data object containing a function and args to pass to that function that do things based on the needsRun parameter
// socket.on('actionReply', function (data) {
//   $('#gamePage').unblock();
//   if (data.needsRun) {
//     data.func(data.args);
//   }
// });

function checkLoginCookie() {
  const username = Cookies.get('username');
  const cloudsavePass = Cookies.get('cloudsavePass');
  
  if (username && cloudsavePass) {
    console.log("Login cookie found, verifying with server.");
    attemptLogin(username, cloudsavePass);
  }
  else {
    console.log("No login cookie found. Displaying login box.");
    showUsername();
    //setTimeout(function() { $("#usernameField").focus() }, 2000);
  }
}

socket.on('GlobalStatsUpdate', function (data) {
  // console.log("Global Stats Update Received:");
  // console.log(data.data);
  handleGlobalStatsUpdate(data.data);
});

socket.on('loginFailure', function (data) {
  console.log("Login not verified. Reason given: '" + data.message + "' Displaying login box.");
  Cookies.remove('username');
  Cookies.remove('cloudsavePass');
  showUsername();
});

socket.on('loginSuccess', function (data) {
  console.log("Login verified! Displaying user info.");
  console.log(data);
  Cookies.set('username', data.username);
  Cookies.set('cloudsavePass', data.pass);
  $("#userInfoUsername").text(Cookies.get("username"));
  updateCharacterData(data);
  showUserInfo();
});

socket.on('clicksConfirmed', function (data) {
  console.log(data.message);
  clickCounter = 0;
  updateClickCounter();
});

//Event Detection
$("#login").click(parseUserForm);
$("#logout").click(logoutUser);

//Parse Username Box
function parseUserForm() {
  // hideAnnouncement("ann_usernameNotification");
  console.log("User Form submitted. Attempting to parse.");
  const usernameInput = $("#usernameField").val();
  const passInput = $("#passwordField").val();
  
  //Check for the cases where username and/or password are blank and catch them
  if (usernameInput === "" || usernameInput.length <= 0) {
    $("#usernameField").focus();
    if (passInput === "" || passInput.length <= 0) {
      // createAnnouncement("ann_usernameNotification", "Username and Password are required.", false);
      return;
    }
    // createAnnouncement("ann_usernameNotification", "Username is required.", false);
    return;
  }
  if (passInput === "" || passInput.length <= 0) {
    // createAnnouncement("ann_usernameNotification", "Password is required.", false);
    return;
  }
  
  //Past the above checks, input assumed good.
  console.log("User form meets parse requirements. Attempting login with server.");
  $("#usernameField").val("");
  $("#passwordField").val("");
  // createAnnouncement("ann_usernameNotification", "Attempting login", true);
  attemptLogin(usernameInput, passInput);
}

function logoutUser() {
  console.log("User requested logout. Deleting cookies.");
  //TODO: emit final update of all relevant data
  socket.emit('logoutUser', { username: Cookies.get('username')});
  Cookies.remove('username');
  Cookies.remove('cloudsavePass');
  Cookies.remove('cData');
  Cookies.remove('regions');
  // createAnnouncement("ann_usernameNotification", "Successfully Logged Out.", false);
  setTimeout(function() {showUsername()}, 1000);
}

function checkSendClicks() {
  let newDate = new Date();
  console.log("Checking if should send clicks");
  if (newDate - timeLastSentClicks > 60000) {
    console.log("Sending clicks update: " + clickCounter);
    socket.emit('clickUpdate', {clicksLastMinute: clickCounter});
    timeLastSentClicks = newDate;
  }
  else {
    console.log("Time till next click update sent: " + ((60000-(newDate - timeLastSentClicks))/1000));
  }
}

//updateFull - basically gameData but forcing client to do a full update
//TODO: Deprecate this because if DOM needs changing it should come from a specific command from the server rather than a gameData update
//DEPRECATED
// socket.on('updateFull', function(data) {
//   console.log("Received updated game data and request for full update");
//   updateFullFunction(data);
//});

// function filterUpdateDataForRegionAttributes(data) {
//   let filtered = [];
//   let criteriaArray = data.regions.find(x => x.name === activeRegion).relevantAttributes;
//   for (let arr in data.attributes) {
//     for (let filter in criteriaArray) {
//       //TODO: Eventually remove this .visible check because server shouldn't send stuff that ain't visible!
//       if(criteriaArray[filter].visible === true && data.attributes[arr].name === criteriaArray[filter].name) {
//         filtered.push(data.attributes[arr]);
//       }
//     }
//   }
//   return filtered;
// }

// function updateFullFunction (data) {
//   console.log("Conducting FULL update");
//   $('#gamePage').unblock();
//   var world = {};
//   world.headerStats = data.globalStats.filter(stat => stat.visibleInHeader === true);
//   decideUpdateMethod("globalAttributesList", "Attributes-Full", {newLIArray: world.headerStats});
//   //now update the current region
//   let regionData = data.regions.find(x => x.name === activeRegion);
//   let region = {};
//   region.name = regionData.displayName;
//   region.attributes = filterUpdateDataForRegionAttributes(data);
//   region.features = regionData.features;
//   decideUpdateMethod("regionAttributesList", "Attributes-Full", {newLIArray: region.attributes});
//   decideUpdateMethod("regionFeaturesList", "Features-Full", {newLIArray: region.features});
//   fullUpdateScheduled = false;
// }

// function formatULTextUpdate(targetArray, contentsType) {
//   switch(contentsType){
//     case "attribute":
//       return targetArray.map(function(element, index, arr) {
//         if (element.visible) {
//           return {headerText: element.displayName, descriptorText: element.value};
//         }
//         else {
//           return;
//         }
//       });
    
//     case "feature":
//       return targetArray.map(function(element, index, arr) {
//         if (element.visible) {
//           if (element.mixedStorage.type == "Timed") {
//             return {headerText: element.displayName, descriptorText: element.descriptorText, buttonText: msToTime((Date.parse(element.mixedStorage.startTime) + element.mixedStorage.duration) - new Date().getTime())};
//           }
//           else {
//             return {headerText: element.displayName, descriptorText: element.descriptorText, buttonText: element.buttonText};
//           }
//         }
//       });
//   }
// }