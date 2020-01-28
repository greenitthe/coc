function updateCharacterData(data) {
  characterData.attributes=data.attributes;
  //cards should be initialized via json then updated either here or when buttons pressed...
  saveGame();
  refreshRegion();
}

function attemptLogin(username, pass) {
  if (!username || !pass) { console.log("ERROR: ATTEMPTING LOGIN WITH UNDEFINED USER (" + username + ") OR PASS (" + pass + ")! ABORTING"); return; }
  socket.emit('verifyLogin', {username: username, pass: pass});
}

function sendAction(actionName, args) {
  socket.emit('attemptAction', {name: actionName, args: args});
}

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

//Parse Username Box
function parseUserForm() {
  // $('#gamePage').unblock();
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
  socket.emit('logoutUser', { username: Cookies.get('username')});
  Cookies.remove('username');
  Cookies.remove('cloudsavePass');
  Cookies.remove('cData');
  loadStatus = 2;
  activeRegion = "Core";
  resetCharacterData();
  //TODO: Get these to work as intended
  // loadedRegions = undefined;
  //regions = $.getJSON('region_templates.json', function (json) { console.log("Regions JSON Loaded"); regions = json; loadStatus--; console.log("Load Status: " + loadStatus); });;
  console.log("Sending clicks update: " + clickCounter);
  socket.emit('clickUpdate', {clicksLastMinute: clickCounter});
  // createAnnouncement("ann_usernameNotification", "Successfully Logged Out.", false);
  setTimeout(function() {showUsername()}, 100);
}

function saveGameStatus(force) {
  let newDate = new Date();
  let interval = 15000;
  console.log("Checking if should send game status");
  if (force || newDate - timeLastSentStatus > interval) {
    console.log("Saving game status...");
    socket.emit('gameStatusUpdate', {attributes: characterData.attributes, clicksSinceLast: clickCounter});
    timeLastSentStatus = newDate;
  }
  else {
    console.log("Time till next save game update sent: " + ((interval-(newDate - timeLastSentStatus))/1000));
  }
}

//Socket Stuff
function connectSocket() {
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

  //gameData
  socket.on('actionResponse', function (data) {
    console.log("Received action response");
    //console.log(data);
    updateCharacterData(data.userData);
  });


  socket.on('gAttrUpdate', function (data) {
    //console.log("Global Stats Update Received:");
    // console.log(data.data);
    handleGlobalAttributesUpdate(data.data);
  });

  socket.on('loginFailure', function (data) {
    console.log("Login not verified. Reason given: '" + data.message + "' Displaying login box.");
    Cookies.remove('username');
    Cookies.remove('cloudsavePass');
    showUsername();
  });

  socket.on('loginSuccess', function (data) {
    console.log("Login verified! Displaying user info.");
    console.log(data.userData);
    Cookies.set('username', data.userData.username);
    Cookies.set('cloudsavePass', data.userData.pass);
    $("#userInfoUsername").text(Cookies.get("username"));
    updateCharacterData(data.userData);
    showUserInfo();
    loadStatus--;
    console.log("Load Status: " + loadStatus);
  });

  socket.on('clicksConfirmed', function (data) {
    console.log(data.other.clicks);
    clickCounter = 0;
    updateClickCounter();
    updateCharacterData(data.userData);
  });

  //Event Detection
  $("#login").click(parseUserForm);
  $("#logout").click(logoutUser);
}

connectSocket();
