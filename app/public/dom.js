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
  let selector = $("#globalAttributes #gClicks .pValue");
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

function setProgressBar($targetProgressHolder, percent, pBarLabel, rBarLabel, leftLabel, rightLabel, speed) {
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
  $targetProgressHolder.find(".progressLeftLabel").html(leftLabel);
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
    let correspAttrInfo = gAttrInfo.filter(attr => attr.id === item.id)[0];
    let targetLI = list.find("#" + correspAttrInfo.name);
    determineUpdateAttrTextOrMakeNew(targetLI, list, item, correspAttrInfo, valueCriteria);
  }
}

function determineUpdateAttrTextOrMakeNew(targetLI, list, item, correspAttrInfo, valueCriteria, includeMax) {
  let text = item.level.toString();
  text += includeMax ? ("/" + item.maxLevel) : "";
  if (targetLI.length === 1) {
    let targetSpan = $($(targetLI[0]).find(valueCriteria)[0]);
    if (targetSpan.text() != text) {
      changeText(targetSpan, text);
    }
  }
  else if (targetLI.length === 0) {
    list.append('<li id="' + correspAttrInfo.name + '"><strong class="name">' + correspAttrInfo.displayName + '</strong><div><span class="' + valueCriteria.substring(1) + '">' + text + '</span><span class="pValue"></span></div></li>');
    console.log("In handleGlobalStatsUpdate, targetLI not found, creating!");
  }
  else {
    console.log(correspAttrInfo.name);
    console.log(text);
    console.log(targetLI);
    console.log("Warning: In handleGlobalStatsUpdate: Multiple TargetLIs found or unexpected find value.");
  }
}

function refreshRegionAndUnblock() {
  refreshRegion();
  $('#gamePage').unblock();
}

function refreshRegionAttributes() {
  console.log("Refreshing Region Attributes");
  attrInfo.filter(attr => attr.region.toLowerCase() === activeRegion.toLowerCase()).forEach(function(item) {
    // console.log("refresh region attributes")
    // console.log(item);
    switch (item.barToDisplayIn) {
      case "currencies":
        let targetAttr = characterData.attributes.filter(attr => attr.id === item.id)[0];
        if (targetAttr.visible == true) {
          handleCurrenciesBarItem(item, targetAttr);
        }
        break;
      case "badges":
        
        break;
      //
    }
  });
  // characterData.attributes.forEach(function(item) {
  //   console.log(item)
  // });
}

function handleCurrenciesBarItem(attrInfoObject, cDataAttrObject) {
  let cList = $("#regionAttributesList");
  let targetLI = cList.find("#" + attrInfoObject.name);
  determineUpdateAttrTextOrMakeNew(targetLI, cList, cDataAttrObject, attrInfoObject, ".cValue", true);
}

function formatUpgradeCost(cardLevel, card) {
  let result = "";
  let isFirst = true;
  let costItem = card.costStructure[cardLevel];
  for (var i = 0; i < costItem.attrID.length; i++) {
    if (isFirst) { isFirst = false; }
    else { result += ", "; }
    let attrID = costItem.attrID[i];
    let isTempAttr = costItem.isTempAttr[i];
    let attrAmount = costItem.attrAmount[i];
    // console.log(costItem)
    // console.log(attrID)
    // console.log(isTempAttr)
    // console.log(attrAmount)
    // console.log(characterData.tempAttributes)
    let costItemName = costItem.isTempAttr[i] ? characterData.tempAttributes.filter(attr => attr.id === costItem.attrID[i])[0].displayName : attrInfo.filter(attr => attr.id === costItem.attrID[i])[0].displayName;
    result += costItem.attrAmount[i] + " " + costItemName;
  }
  return "(" + result + ")"
}

function refreshRegionCards() {
  console.log("Refreshing Region Cards")
  const cardListSelector = "#regionCardsList";
  var cardList = $(cardListSelector);
  var regionCardsArray = cards.filter(card => card.region.toLowerCase() === activeRegion.toLowerCase());
  regionCardsArray.forEach(function (card) {
    let content = "";
    let targetLI = cardList.find("#" + card.name);
    //cardOwnAttr is the attributes of the card's attribute - just CARD ATTR level, maxLevel and attr ID, not relevant until I display them (and an upgrade button for the card itself)
    let cardOwnAttr = characterData.attributes.filter(attr => attr.id === card.attributeID)[0];
    let cardAttr = attrInfo.filter(attr => attr.id === card.attributeID)[0];
    let cardTAttr = characterData.tempAttributes.filter(attr => attr.id === card.relevantTAttrID)[0];
    let pBarTarget, pBarPercent, pBarLeftLabel, pBarRightLabel, pBarMinLabel, pBarMaxLabel;
    //Below is not presently needed. May add tooltips or something in the future so leaving for now...
    // let targetTAttrInfo = tAttrInfo.filter(attr => attr.id === card.relevantTAttrID)[0];
    switch(card.type) {
      case "multiclickGatherer": //read: progress bar that fills up to generate item
        content="<li id='" + cardAttr.name + "'><div class='entryHeader'><strong>" + cardAttr.displayName + "</strong></div><div class='entryDescriptor'><span>" + cardAttr.description + "</span></div><button class='entryButton collectButton' onclick=\"buttonUsed('" + card.type + "', '" + cardAttr.name + "')\"><span class='buttonText'>" + card.buttonText + "</span></button><div class='progressWrapper'><div class='progressLeftLabel hidden'><span>" + " " + "</span></div><div class='progressHolder'><div class='progressBar progressBlue'><span class='progressBarText'>" + cardTAttr.level + "</span></div><div class='progressRemaining'><span class='progressRemainingText'>" + (cardTAttr.maxLevel - cardTAttr.level) + "</span></div></div><div class='progressRightLabel'><span>" + cardTAttr.maxLevel + "</span></div></div></li>";
        pBarTarget = $(cardListSelector + " #" + cardAttr.name + " .progressWrapper");
        pBarPercent = ((cardTAttr.maxLevel - (cardTAttr.maxLevel - cardTAttr.level))/cardTAttr.maxLevel)*100;
        pBarLeftLabel = cardTAttr.level;
        pBarRightLabel = (cardTAttr.maxLevel - cardTAttr.level);
        pBarMinLabel = "";
        pBarMaxLabel = cardTAttr.maxLevel;
        break;
      case "upgradeable":
        content="<li id='" + cardAttr.name + "'><div class='entryHeader'><strong>" + cardAttr.displayName + "</strong></div><div class='entryDescriptor'><span>" + cardAttr.description + "</span></div><button class='entryButton collectButton' onclick=\"buttonUsed('" + card.type + "', '" + cardAttr.name + "')\"><span class='buttonText'>" + card.buttonText + " " + formatUpgradeCost(cardOwnAttr.level, card) + "</span></button><div class='progressWrapper'><div class='progressLeftLabel'><span>" + cardOwnAttr.level + "</span></div><div class='progressHolder'><div class='progressBar progressRedOrange'><span class='progressBarText'>" + cardOwnAttr.level + "</span></div><div class='progressRemaining'><span class='progressRemainingText'>" + " " + "</span></div></div><div class='progressRightLabel'><span>" + cardOwnAttr.maxLevel + "</span></div></div></li>";
        pBarTarget = $(cardListSelector + " #" + cardAttr.name + " .progressWrapper");
        pBarPercent = ((cardOwnAttr.maxLevel - (cardOwnAttr.maxLevel - cardOwnAttr.level))/cardOwnAttr.maxLevel)*100;
        pBarLeftLabel = cardOwnAttr.level;
        pBarRightLabel = "";
        pBarMinLabel = cardOwnAttr.level;
        pBarMaxLabel = cardOwnAttr.maxLevel;
        break;
    }
    if (targetLI.length<=0) {
      cardList.append(content);
    }
    if (pBarTarget !== undefined) {
      setProgressBar(pBarTarget, pBarPercent, pBarLeftLabel, pBarRightLabel, pBarMinLabel, pBarMaxLabel, 0);
    }
  });
}

// function getCurrentRegion() {
//   return regions.filter(aRegion => aRegion.name == activeRegion)[0];
// }

function refreshRegion() {
  //console.log("Refreshing Region from Character Data");

  refreshRegionAttributes();
  refreshRegionCards();
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
