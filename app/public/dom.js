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
  //$('#gamePage').unblock();
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
  let selector = $("#globalAttributes #totalclicks .gsPValue");
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
  $targetProgressHolder.find(".progressRemaining").animate({width: ((100 - (progressBarWidth*100)) / 100) }, 6);
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
 * Returns sorted array based on the sortOrder property of the objects within
 * @param {Array} dataArr An array of objects sortOrder property
 */
function sortDataBySortOrder(dataArr) {
  return dataArr.sort(function(a,b) {
    const aOrder = a.sortOrder;
    const bOrder = b.sortOrder;
    return aOrder > bOrder ? 1 : -1;
  });
}

/**
 * Handle Updating Global attributes given the Data from Server
 * @param {Array} data An array of objects (of the gAttr schema) containing the updated attribute info
 */
function handleGlobalAttributesUpdate(data) {
  let sortedData = sortDataBySortOrder(data);
  updateLIsWithinListIfTextDiffers(sortedData, "#globalAttributesList", ".gsValue");
}

function updateLIsWithinListIfTextDiffers(sortedData, listTarget, valueCriteria) {
  for (var i = 0; i < sortedData.length; i++) {
    let item = sortedData[i];
    let list = $(listTarget);
    let correspAttr = gAttrInfo.filter(attr => attr.id === item.id)[0];
    let targetLI = list.find("#" + correspAttr.name);
    determineUpdateCardTextOrMakeNew(targetLI, list, item, correspAttr, valueCriteria);
  }
}

function determineUpdateCardTextOrMakeNew(targetLI, list, item, correspAttr, valueCriteria) {
  if (targetLI.length === 1) {
    let targetSpan = $($(targetLI[0]).find(valueCriteria)[0]);
    if (targetSpan.text() != item.level.toString()) {
      changeText(targetSpan, item.level.toString());
    }
  }
  else if (targetLI.length === 0) {
    list.append('<li id="' + correspAttr.name + '"><strong class="gsName">' + correspAttr.displayName + '</strong><div><span class="gsValue">' + item.level.toString() + '</span><span class="gsPValue"></span></div></li>');
    console.log("In handleGlobalStatsUpdate, targetLI not found, creating!");
  }
  else {
    console.log(correspAttr.name);
    console.log(item.level.toString());
    console.log(targetLI);
    console.log("Warning: In handleGlobalStatsUpdate: Multiple TargetLIs found or unexpected find value.");
  }
}

function refreshRegionAndUnblock() {
  $('#gamePage').unblock();
  refreshRegion();
}

// function refreshRegionAttributes() {
//   //reworking from .currencies to .attributes
//   characterData.attributes.forEach(function(item) {
//     let aList = $("#regionAttributesList");
//     let targetLI = aList.find("#" + item.name.toLowerCase());
//     determineUpdateCardTextOrMakeNew(targetLI, aList, item);
//     if (targetLI.length === 1) {
//       let targetSpan = $($(targetLI[0]).find(".aValue")[0]);
//       if (targetSpan.text() != item.amount.toString() + '/' + item.maxAmount.toString()) {
//         changeText(targetSpan, item.amount.toString() + '/' + item.maxAmount.toString());
//       }
//     }
//     else if (targetLI.length === 0) {
//       aList.append('<li id="' + item.name.toLowerCase() + '"><strong class="aName">' + item.name + '</strong><div><span class="aValue">' + item.amount + '/' + item.maxAmount + '</span><span class="aPValue"></span></div></li>');
//       console.log("In refreshRegion: In refresh attributes: targetLI not found, creating!");
//     }
//     else {
//       console.log(item.name.toLowerCase());
//       console.log(item.amount);
//       console.log(targetLI);
//       console.log("Warning: In refreshRegion: In refresh attributes: Multiple TargetLIs found or unexpected find value.");
//     }
//   });
// }
//
// function refreshRegionCards() {
//   var currentRegion = getCurrentRegion();
//   const featuresListSelector = "#regionFeaturesList";
//   var featuresList = $(featuresListSelector);
//   //reworking from .features to .cards
//   currentRegion.cards.forEach(function (item) {
//     //console.log($("#regionFeaturesList #" + item.name + " .progressWrapper"))
//     var content = "";
//     var targetLI = featuresList.find("#" + item.name);
//     let pBarTarget, pBarPercent, pBarLeftLabel, pBarRightLabel, pBarMaxLabel;
//     switch(item.cardType) {
//       case "progressBar":
//         content="<li id='" + item.name + "'><div class='entryHeader'><strong>" + item.displayName + "</strong></div><div class='entryDescriptor'><span>" + item.description + "</span></div><button class='entryButton collectButton' onclick=\"buttonUsed('progressBar', '" + item.name + "')\"><span class='buttonText'>" + item.buttonText + "</span></button><div class='progressWrapper'><div class='progressHolder'><div class='progressBar progressBlue'><span class='progressBarText'>" + item.currentProgress + "</span></div><div class='progressRemaining'><span class='progressRemainingText'>" + (item.progressRequired - item.currentProgress) + "</span></div></div><div class='progressRightLabel'><span>" + item.progressRequired + "</span></div></div></li>";
//         pBarTarget = $(featuresListSelector + " #" + item.name + " .progressWrapper");
//         pBarPercent = item.actualPercent;
//         pBarLeftLabel = item.currentProgress;
//         pBarRightLabel = (item.progressRequired - item.currentProgress);
//         pBarMaxLabel = item.progressRequired;
//         break;
//
//       case "upgradeShop":
//         let ownedUpgradeObject = characterData.upgrades.filter(upgrade => upgrade.name == item.upgradeTarget)[0];
//         let masterUpgradeObject = upgradeList.filter(upgrade => upgrade.name == item.upgradeTarget)[0];
//         content="<li id='" + item.name + "'><div class='entryHeader'><strong>" + item.displayName + "</strong></div><div class='entryDescriptor'><span>" + item.description + "</span></div><button class='entryButton collectButton' onclick=\"buttonUsed('upgradeShop', '" + item.name + "')\"><span class='buttonText'>" + item.buttonText + "</span></button><div class='progressWrapper'><div class='progressHolder'><div class='progressBar progressBlue'><span class='progressBarText'>" + ownedUpgradeObject.level + "</span></div><div class='progressRemaining'><span class='progressRemainingText'>" + (masterUpgradeObject.maxLevel - ownedUpgradeObject.level) + "</span></div></div><div class='progressRightLabel'><span>" + masterUpgradeObject.maxLevel + "</span></div></div></li>";
//         pBarTarget = $(featuresListSelector + " #" + item.name + " .progressWrapper");
//         pBarPercent = (ownedUpgradeObject.level / masterUpgradeObject.maxLevel) * 100;
//         pBarLeftLabel = ownedUpgradeObject.level;
//         pBarRightLabel = (masterUpgradeObject.maxLevel - ownedUpgradeObject.level);
//         pBarMaxLabel = masterUpgradeObject.maxLevel;
//         break;
//     }
//     if (targetLI.length<=0) {
//       featuresList.append(content);
//     }
//     setProgressBar(pBarTarget, pBarPercent, pBarLeftLabel, pBarRightLabel, pBarMaxLabel, 0);
//     // if (targetLI.length>0) {
//     //   if (content != targetLI.html()) {
//     //     targetLI.html(content);
//     //   }
//     // }
//     // else {
//     //   featuresList.append(content);
//     // }
//   });
// }

function getCurrentRegion() {
  return regions.filter(aRegion => aRegion.name == activeRegion)[0];
}

function refreshRegion() {
  //console.log("Refreshing Region from Character Data");

  // refreshRegionAttributes();
  // refreshRegionCards();
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
