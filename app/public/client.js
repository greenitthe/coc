setInterval(checkSendClicks, 10000);

function incrementClicks() {
  clickCounter = clickCounter++ >= 600 ? 600 : clickCounter++;
  updateClickCounter();
}

// function checkTimedReady(name) {
//   console.log("checkTimedReady: " + name);
//   sendAction("checkTimer", {regionName: activeRegion, timerName: name});
// }

function updateRegionAttribute(targetAttributeID, isForMaxLevel, incrementAmount = 1) {
  let referenceIndex = characterData.attributes.findIndex((item => item.id == targetAttributeID));
  let reference = characterData.attributes[referenceIndex];
  if (isForMaxLevel) {
    reference.maxLevel += rewardStructure.attrAmount[i];
  }
  if (reference.level + incrementAmount <= reference.maxLevel) {
    reference.level+=incrementAmount;
  }
  else {
    reference.level = reference.maxLevel;
  }
  console.log("Sending attributeUpdate");
  saveGame();
  sendAction("attributeUpdate", {attributes: characterData.attributes});
}

function checkAffordableCostStructure(costStructure) {
  let canAfford = true;
  for (var i = 0; i < costStructure.attrID.length; i++) {
    let attributes = costStructure.isTempAttr[i] ? characterData.tempAttributes : characterData.attributes;
    let indexIfAvail = attributes.findIndex(attr => attr.id == costStructure.attrID[i]);
    if (indexIfAvail === -1 || attributes[indexIfAvail].level < costStructure.attrAmount) {
      canAfford = false;
    }
  }
  return canAfford;
}

function buttonUsed(type, name) {
  console.log("Button used, type: " + type + " | name: " + name);
  incrementClicks();
  let regionCardsArray = cards.filter(card => card.region.toLowerCase() === activeRegion.toLowerCase());
  let buttonCard = regionCardsArray.filter(card => card.name == name && card.type == type)[0];
  switch (type) {
    case "upgradeable":
      let cardAttr = characterData.attributes.filter(attr => attr.id == buttonCard.attributeID)[0];
      let canAfford = checkAffordableCostStructure(buttonCard.costStructure[cardAttr.level]);
      if (canAfford) {
        console.log("CanAfford upgrade, sending purchase attempt.");
        sendAction("upgradePurchaseAttempt", {cardName: name});
      }
      //upon receipt of action response saveGame and refreshRegion
      break;
    case "multiclickGatherer":
      let relevantTAttr = characterData.tempAttributes.filter(attr => attr.id == buttonCard.relevantTAttrID)[0];
      let maxProgress = relevantTAttr.maxLevel;
      relevantTAttr.level++;
      if (relevantTAttr.level >= maxProgress) {
        relevantTAttr.level = 0;
        let rewardStructure = buttonCard.rewardStructure[relevantTAttr.level];
        for (i = 0; i < rewardStructure.attrID.length; i++) {
          let targetedAttributeIndex = characterData.attributes.findIndex(attr => attr.id == rewardStructure.attrID[i]);
          updateRegionAttribute(rewardStructure.attrID[i], rewardStructure.isAwardForMaxLevel[i], rewardStructure.attrAmount[i]);
        }
      }
      let pBarTarget = $("#regionCardsList #" + buttonCard.name + " .progressWrapper");
      let pBarPercent = ((relevantTAttr.maxLevel - (relevantTAttr.maxLevel - relevantTAttr.level))/relevantTAttr.maxLevel)*100;
      setProgressBar(pBarTarget, pBarPercent, relevantTAttr.level, (relevantTAttr.maxLevel - relevantTAttr.level), "", relevantTAttr.maxLevel, 100);
      refreshRegionAttributes();
      saveGame();
      break;
  }
}

function lookupAndSpendCurrency(spendTarget, spendAmount) {

}

function changeActiveRegion(targetRegion) {
  $("#sidebar ul>li.active").removeClass("active");
  let navLink;
  if (targetRegion === "Core") {
    navLink = $("#coreButton");
  }
  else {
    navLink = $("#sidebar ul li ul li .sidebarButton:contains('" + targetRegion + "')");
  }
  navLink.parent("li").addClass("active");
  navLink.parent("li").parent("ul").parent("li").addClass("active");
  activeRegion = targetRegion;
  Cookies.set("activeRegion", activeRegion);
  $("#regionName").text(activeRegion);
  $('#gamePage').block({ message: "Loading region... Waiting for server...", css: {backgroundColor: 'transparent', border: 'none', color: 'white'} });
  queueAfterLoadStatus(refreshRegionAndUnblock, {});
}

function queueAfterLoadStatus(functionToRun, argumentsToPass) {
  if (loadStatus === 0) {
    console.log("Fully loaded... Unlocking region.");
    functionToRun(argumentsToPass);
  }
  else {
    console.log("Load Status not Finished");
    setTimeout(queueAfterLoadStatus, 100, functionToRun, argumentsToPass);
  }
}

//TODO: move activeRegion to server potentially for convenience
changeActiveRegion(activeRegion);
queueAfterLoadStatus(updateClickCounter);