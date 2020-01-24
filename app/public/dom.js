//Announcements
function toggleElements(element1Name, element2Name) {
  $(element1Name).hide();
  $(element2Name).show();
}

/**
 * Show user info
 */
function showUserInfo() {
  $("#usernameForm").removeClass("slideInDown").addClass("slideOutUp");
  $("#userInfo").removeClass("slideOutDown").addClass("slideInUp");
  setTimeout(toggleElements, 1500, "#usernameForm", "#userInfo");
  $('#gamePage').unblock();
}

function showUsername() {
  $("#userInfo").removeClass("slideInUp").addClass("slideOutDown");
  $("#usernameForm").removeClass("slideOutUp").addClass("slideInDown");
  $('#gamePage').block({ message: "Please sign in.", css: {backgroundColor: 'transparent', border: 'none', color: 'white'} });
  setTimeout(toggleElements, 1000, "#userInfo", "#usernameForm");
  setTimeout(focusElement, 1001, "#usernameField");
}

function focusElement(elementName) {
  $(elementName).focus();
}

/**
 * Delete element
 * @param {Node} element The node to delete.
 */
function delElement(element) {
  element.remove();
}

//Sidebar Toggle
$(document).ready(function () {
  $('.sidebarCollapse').on('click', function () {
    $('#sidebar').toggleClass('active');
  });
});

function updateClickCounter() {
  let selector = $("#globalAttributes #clicks .gsPValue");
  let newText = " (+" + clickCounter + ")";
  changeText(selector, newText);
}

//Progress bar stuff
function getProgressBarPercent($targetProgressHolder) {
  let progressHolderWidth = $($targetProgressHolder.find(".progressHolder")[0]).width();
  let onePercent = progressHolderWidth / 100;
  let currentWidth = $targetProgressHolder.find(".progressBar").width();
  let currentPercent = currentWidth / onePercent;
  return currentPercent;
}

//NOTICE: Only for testing! Not to be used programmatically - SET PERCENTAGE DIRECTLY!
function addPercentToProgressBar($targetProgressHolder, addPercent, pBarLabel, rBarLabel, rightLabel) {
  let oldPercent = getProgressBarPercent($targetProgressHolder);
  let newPercent = oldPercent + addPercent;
  setProgressBar($targetProgressHolder, newPercent, pBarLabel, rBarLabel, rightLabel, 100);
}

function setProgressBar($targetProgressHolder, percent, pBarLabel, rBarLabel, rightLabel, speed) {
  let progressHolderWidth = $($targetProgressHolder.find(".progressHolder")[0]).width();
  let progressBarWidth = percent * progressHolderWidth / 100;
  if (percent < 1) { //new percent less than 1, hide left text
    $targetProgressHolder.find(".progressBarText").hide();
  }
  else { //new percent greater than or equal to 1, show left text
    $targetProgressHolder.find(".progressBarText").show();
  }
  $targetProgressHolder.find(".progressBar").animate({width: progressBarWidth }, speed);
  $targetProgressHolder.find(".progressRemaining").animate({width: ((100 - (progressBarWidth*100)) / 100) }, speed);
  $targetProgressHolder.find(".progressBarText").html(pBarLabel);
  $targetProgressHolder.find(".progressRemainingText").html(rBarLabel);
  $targetProgressHolder.find(".progressRightLabel").html(rightLabel);
}

function stripWhitespace(text) {
  return text.replace(/\s/g, "");
}

/**
 * Handle changing element text in a prettier way
 * @param {Node} targetElement Element as a jQuery Object needing text update
 * @param {String} newText Text to replace existing with
 */
function changeText(targetElement, newText){
    targetElement.fadeOut(100, function() {
        $(this).text(newText).fadeIn(100);
    });
}

/**
 * Handle Updating Global Stats given the Data from Server on GStats
 * @param {Array} data An array of objects (of the GlobalStats schema) containing the updated stat info
 */
function handleGlobalStatsUpdate(data) {
  let sortedData = data.sort(function(a,b) {
    const aOrder = a.sortOrder;
    const bOrder = b.sortOrder;
    let comparison = 0;
    aOrder > bOrder ? comparison = 1 : comparison = -1;
    return comparison;
  });
  for (var i = 0; i < sortedData.length; i++) {
    let item = sortedData[i];
    let gsList = $("#globalAttributesList");
    let targetLI = gsList.find("#" + item.name.toLowerCase());
    if (targetLI.length == 1) {
      let targetSpan = $($(targetLI[0]).find(".gsValue")[0]);
      if (targetSpan.text() != item.value.toString()) {
        changeText(targetSpan, item.value.toString());
      }
    }
    else if (targetLI.length === 0) {
      gsList.append('<li id="' + item.name.toLowerCase() + '"><strong class="gsName">' + item.name + '</strong><div><span class="gsValue">' + item.value + '</span><span class="gsPValue"></span></div></li>');
      console.log("In handleGlobalStatsUpdate, targetLI not found, creating!");
    }
    else {
      console.log(item.name.toLowerCase());
      console.log(item.value);
      console.log(targetLI);
      console.log("Warning: In handleGlobalStatsUpdate: Multiple TargetLIs found or unexpected find value.");
    }
  }
}

function refreshRegionAndUnblock() {
  $('#gamePage').unblock();
  refreshRegion();
}

function refreshRegionAttributes() {
  characterData.currencies.forEach(function(item) {
    let aList = $("#regionAttributesList");
    let targetLI = aList.find("#" + item.name.toLowerCase());
    if (targetLI.length === 1) {
      let targetSpan = $($(targetLI[0]).find(".aValue")[0]);
      if (targetSpan.text() != item.amount.toString() + '/' + item.maxAmount.toString()) {
        changeText(targetSpan, item.amount.toString() + '/' + item.maxAmount.toString());
      }
    }
    else if (targetLI.length === 0) {
      aList.append('<li id="' + item.name.toLowerCase() + '"><strong class="aName">' + item.name + '</strong><div><span class="aValue">' + item.amount + '/' + item.maxAmount + '</span><span class="aPValue"></span></div></li>');
      console.log("In refreshRegion: In refresh attributes: targetLI not found, creating!");
    }
    else {
      console.log(item.name.toLowerCase());
      console.log(item.amount);
      console.log(targetLI);
      console.log("Warning: In refreshRegion: In refresh attributes: Multiple TargetLIs found or unexpected find value.");
    }
  });
}

function refreshRegionItems() {
  
}

function refreshRegionUpgrades() {
  
}

function refreshRegionFeatures() {
  var currentRegion = regions.filter(aRegion => aRegion.name == activeRegion)[0];
  var featuresList = $("#regionFeaturesList");
  currentRegion.features.forEach(function (item) {
    var content = "";
    var targetLI = featuresList.find("#" + item.name);
    switch(item.cardType) {
      case "progressBar":
        content="<li id='" + item.name + "'><div class='entryHeader'><strong>" + item.displayName + "</strong></div><div class='entryDescriptor'><span>" + item.description + "</span></div><button class='entryButton collectButton' onclick=\"buttonUsed('progressBar', '" + item.name + "')\"><span class='buttonText'>BUTTONTEXT</span></button><div class='progressWrapper'><div class='progressHolder'><div class='progressBar progressBlue'><span class='progressBarText'>" + item.currentProgress + "</span></div><div class='progressRemaining'><span class='progressRemainingText'>" + (item.progressRequired - item.currentProgress) + "</span></div></div><div class='progressRightLabel'><span>" + item.progressRequired + "</span></div></div></li>";
        if (item.actualPercent != getProgressBarPercent($("#" + item.name + " .progressWrapper"))) {
          console.log("not the same")
          
        }
        break;
    }
    if (targetLI.length>0) {
      if (content != targetLI.html()) {
        targetLI.html(content);
      }
    }
    else {
      featuresList.append(content);
    }
  });
}

function refreshRegion() {
  console.log("Refreshing Region from Character Data");
  
  refreshRegionAttributes();
  refreshRegionItems();
  refreshRegionUpgrades();
  refreshRegionFeatures();
  
  // var world = {};
  // world.headerStats = data.globalStats.filter(stat => stat.visibleInHeader === true);
  // decideUpdateMethod("globalAttributesList", "Attributes-Full", {newLIArray: world.headerStats});
  // //now update the current region
  // let regionData = data.regions.find(x => x.name === activeRegion);
  // let region = {};
  // region.name = regionData.displayName;
  // region.attributes = filterUpdateDataForRegionAttributes(data);
  // region.features = regionData.features;
  // decideUpdateMethod("regionAttributesList", "Attributes-Full", {newLIArray: region.attributes});
  // decideUpdateMethod("regionFeaturesList", "Features-Full", {newLIArray: region.features});
  // fullUpdateScheduled = false;
}

function buildCardHTML(item) {
  var content = "";
  switch (item.cardType) {
    /***
    * TODO:
    * Modify these cases so that there is different stuff for each (with appropriately linked buttons) and make them have a title using item.name rather than a button using it
    * Coinciding with the above, will need the necessary helper functions for each button whether that be buying something with the button, checking the timer getting rewards and resetting with Timed, or checking harvesting and resetting a given plot for MultiPlot, etc.
    ***/
    case "progressBar":
      content = "<div class='entryHeader'><strong>" + item.displayName + "</strong></div><div class='entryDescriptor'><span>" + item.description + "</span></div><button class='entryButton collectButton' onclick=\"buttonUsed('" + stripWhitespace(item.name) + "')\"><span class='buttonText'>BUTTONTEXT</span></button><div class='progressWrapper'><div class='progressHolder'><div class='progressBar progressBlue'><span class='progressBarText'>0</span></div><div class='progressRemaining'><span class='progressRemainingText'>10</span></div></div><div class='progressRightLabel'><span>10</span></div></div>";
      break;
    
    // case "automator":
    //   content = "";
    //   break;
     
    // case "Timed":
    //   content = "<div class='entryHeader'><strong>" + item.name + "</strong></div><div class='entryDescriptor'><span>" + item.descriptorText + "</span></div><button class='entryButton collectButton' onclick='checkTimedReady(\"" + item.name + "\")'><span class='buttonText'>" + msToTime((Date.parse(item.mixedStorage.startTime) + item.mixedStorage.duration) - new Date().getTime()) + "</span></button>";
    //   break;
    
    // case "Button":
    //   content = "<div class='entryHeader'><strong>" + item.name + "</strong></div><div class='entryDescriptor'><span>" + item.descriptorText + "</span></div><button class='entryButton collectButton' onclick='buttonUsed(\"" + item.name + "\")'><span class='buttonText'>" + item.buttonText  +"</span></button>";
    //   break;
    
    // case "MultiPlot":
    //   content = "<button class='entryButton' onclick='plotButton('" + item.name + "')><span class='buttonText'>" + item.name + "</span></button>";
    //   break;
  }
  
  return ("<li id='" + item.name + "'>" + content + "</li>");
}

/**
 * Adds a specified location to the sidebar, and if necessary also adds its specified top-level location to the sidebar
 * @param {String} topLevelLocationName E.g. World, Home
 * @param {String} locationName E.g. World Shop, Region Tree, Garden
 * @param {String} optionalTLIconName E.g. fa-globe, fa-home
 */
function addSidebarLocation(topLevelLocationName, locationName, optionalTLIconName="") {
  let topLevelSearch = "#sidebar ul #" + camelize(topLevelLocationName + "TopLevelMenu");
  let topLevelA = $(topLevelSearch);
  if (topLevelA.length === 0) { //couldnt find the specified topLevelA by ID, so assuming need to add
    let newTopLevel = "<li><a id='" + camelize(topLevelLocationName + "TopLevelMenu") + "' class='sidebarButton dropdown-toggle' href='#" + camelize(topLevelLocationName + "Submenu") + "' data-toggle='collapse' aria-expanded='false'><i class='fa " + optionalTLIconName + "'></i>" + topLevelLocationName + "</a><ul id='" + camelize(topLevelLocationName + "Submenu") + "' class='collapse list-unstyled'></ul></li>";
    $(newTopLevel).insertBefore("#sidebar ul .flow-bottom");
    topLevelA = $(topLevelSearch);
  }
  let topLevelUL = $(topLevelSearch + " + #" + camelize(topLevelLocationName + "Submenu")); //get sibling submenu
  let newLocationEntry = "<li><button class=\"sidebarButton\" onclick=\"changeActiveRegion('" + locationName + "')\">" + locationName + "</button></li>";
  $(topLevelUL).append(newLocationEntry);
}

addSidebarLocation("Home", "Garden", "fa-home");
addSidebarLocation("Home", "Armchair");

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index == 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

function msToTime(s) {
  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;
  var text = "";
  if (hrs > 0) { text += hrs + " hr "; }
  if (hrs > 0 || mins > 0) { text += mins + " min "; }
  if (hrs > 0 || mins > 0 || secs > 0) { text += secs + " sec"; }
  else { text += "Ready!"; }

  return text;
}

// /**
// * Update Currency List by ID
// * @param {Array} newLiArray An array containing objects with the following properties: name (string), value (numeric), visible (boolean)
// */
// function updateCurrencyListByID(listID, newLiArray) {
//   const target = $("#" + listID);
//   target.empty();
//   var items = [];
//   $.each(newLiArray, function(i, item) {
//     itemString = "<li id='" + item.name + "'><div class='entryHeader'><strong>" + item.displayName + "</strong></div><div class='entryDescriptor'><span>" + item.value + "</span></div></li>";
//     items.push(itemString);
//   });
//   target.append(items.join(''));
// }

// /**
// * Update Currency List by ID
// * @param {Array} newLiArray An array containing objects with the following properties: name (string), value (numeric), visible (boolean)
// */
// function updateIncrementerListByID(listID, newLiArray) {
//   console.log("updateIncrementerListByID | "+ listID)
//   console.log(newLiArray)
//   const target = $("#" + listID);
//   target.empty();
//   var items = [];
//   //TODO: Figure out how to handle looking up type of incrementer
//   $.each(newLiArray, function(index, item) {
//     itemString = buildCardHTML(item);
//     items.push(itemString);
//   });
//   target.append(items.join(''));
//   let progressBarArray = newLiArray.filter(x => x.cardType === "progressBar");
//   $.each(progressBarArray, function(index, item) {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
//     //TOP TODO: make it so this and the other stuff on the page doesnt get a full update each time again... yeesh this is a pain but atlast its updating
//     //GET THE FLASHING EFFECT WORKING TOO WHEN STUFF UPDATES AGAIN! DUNNO WHY THAT BROKE
//     //ALSO on mobile the currencies won't wrap if overflow... probably cause of set height... DANGIT
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
//     if (item.name === "lifting") {
//       setProgressBar($("#" + item.name + " .progressWrapper"), (item.metadata.setProgress / item.metadata.repsPerSet) * 100, item.metadata.setProgress, item.metadata.repsPerSet - item.metadata.setProgress, item.metadata.repsPerSet);
//     }
//   });
// }

// /**
// * Update Specific Text for ID
// * @param {String} liID A string with the un-#'d ID of the target LI
// * @param {String} newText The text that will replace the existing text in the button
// */
// function updateTextForSpecificID(liID, newText) {
//   const target = $("#" + liID);
//   target.text = newText;
// }

// /**
// * Updates the text of each newTextArr entry
// * @param {String} ulID A string with the un-#'d ID of the target UL
// * @param {Array} {Object} newTextArr The array containing the objects of the form: headerText, descriptorText, buttonText describing how to update each (if update necessary else null). Button text undefined for currencies
// */
// function updateAllLITextUnderULByID(ulID, newTextArr) {
//   /*
  
//   Todo: Have this check whether the text is the same, if so don't bother updating the DOM
  
//   */
//   $.each(newTextArr, function(index, element) {
//     if (element) {
//       let textPath = "";
//       if (element.headerText !== undefined) {
//         textPath = "#" + stripWhitespace(element.headerText) + " .entryHeader strong";
//         let header = $(textPath);
//         //if different, update text, else skip
//         if (header.text() != element.headerText) {
//           changeText(textPath, element.headerText);
//         }
//       }
//       if (element.descriptorText !== undefined) {
//         textPath = "#" + stripWhitespace(element.headerText) + " .entryDescriptor>span";
//         let descriptor = $(textPath);
//         //if different, update text, else skip)
//         if (descriptor.text() != element.descriptorText) {
//           changeText(textPath, element.descriptorText);
//         }
//       }
//       if (element.buttonText !== undefined) { //if buttonText is undefined, is currency
//         textPath = "#" + stripWhitespace(element.headerText) + " .entryButton .buttonText";
//         let button = $(textPath);
//         if (button && button.is(":visible")) { //if the button is in existence and visible
//           if (element.buttonText === "") { //if buttonText is blank, hide the button
//             console.log("Hiding button");
//             button.hide();
//           }
//           else {
//             button.show(); //make visible if not already
//             //if different, update text, else skip
//             if (button.text() != element.buttonText) {
//               changeText(textPath, element.buttonText);
//             }
//           }
//         }
//         else {
//           console.log("CRITICAL WARNING - Attempting to edit the text of a non-existant button!");
//         }
//       }
//     }
//   });
// }

// /**
// * Decides which update method to use based on updateType and formats the given information appropriately for that method
// * @param {String} givenID The target ID without the preceding #
// * @param {String} updateType A string describing what kind of update this is
// * @param {Array} {Object} args An array of objects which include necessary information based on updateType
// */
// function decideUpdateMethod(givenID, updateType, args) {
//   switch(updateType) {
//     case "Features-Full":
//       updateIncrementerListByID(givenID, args.newLIArray);
//       break;
    
//     case "Attributes-Full":
//       updateCurrencyListByID(givenID, args.newLIArray);
//       break;
      
//     // Deprecated
//     // case "Text-Only":
//     //   updateAllLITextUnderULByID(givenID, args.textArr);
//     //   break;
//   }
// }

// /** BIG TODO: SOOOO it would be best if this could be designed such that updateCurrencyList and updateIncrementerList just update the text rather than the entire set of lis each time because that's inefficient and also introduces a kind of annoying flashing on hover css... just don't know how best to tackle that right now. This whole thing could stand to be reworked but I want to get actual content in and bring in plinko **/