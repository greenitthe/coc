setInterval(saveGameStatus, 5000);

function incrementClicks() {
  clickCounter = clickCounter++ >= 600 ? 600 : clickCounter++;
  updateClickCounter();
}

function checkPassives() {
  let passiveCards = cards.filter(card => card.region.toLowerCase() == activeRegion.toLowerCase() && card.type == "passive");
  passiveCards.forEach(function(card) {
    let rS = card.rewardStructure[0];
    for (var i = 0; i < rS.attrID.length; i++) {
      let targetAttr = rS.isTempAttr[i] ? characterData.tempAttributes.filter(attr => attr.id == rS.attrID[i])[0] : characterData.attributes.filter(attr => attr.id == rS.attrID[i])[0];
      let multiplier = 1;
      if (characterData.tempAttributes.filter(attr => attr.id == card.relevantTAttrID)[0].level !== 0) {
        multiplier = Math.round((new Date() - characterData.tempAttributes.filter(attr => attr.id == card.relevantTAttrID)[0].level) / 1000);
      }
      characterData.tempAttributes.filter(attr => attr.id == card.relevantTAttrID)[0].level = new Date();
      if (rS.isAwardForMaxLevel[i]) {
        targetAttr.maxLevel += (rS.attrAmount[i]) * multiplier;
      }
      else {
        let combinedValue = (targetAttr.level + rS.attrAmount[i]) * multiplier;
        targetAttr.level = combinedValue > targetAttr.maxLevel ? targetAttr.maxLevel : combinedValue;
      }
    }
  });
  refreshRegionAttributes();
  setTimeout(checkPassives, 1000);
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
  let cardAttr = characterData.attributes.filter(attr => attr.id == buttonCard.attributeID)[0];
  let relevantTAttr, maxProgresss, pBarTarget, pBarPercent;
  switch (type) {
    case "upgradeable":
      let canAfford = checkAffordableCostStructure(buttonCard.costStructure[cardAttr.level]);
      if (canAfford) {
        console.log("CanAfford upgrade, sending purchase attempt.");
        
        sendAction("upgradePurchaseAttempt", {cardName: name});
      }
      //upon receipt of action response saveGame and refreshRegion
      break;
    case "multiclickGatherer":
      relevantTAttr = characterData.tempAttributes.filter(attr => attr.id == buttonCard.relevantTAttrID)[0];
      maxProgress = relevantTAttr.maxLevel;
      relevantTAttr.level++;
      if (relevantTAttr.level >= maxProgress) {
        relevantTAttr.level = 0;
        let rewardStructure = buttonCard.rewardStructure[cardAttr.level];
        for (i = 0; i < rewardStructure.attrID.length; i++) {
          let targetedAttributeIndex = characterData.attributes.findIndex(attr => attr.id == rewardStructure.attrID[i]);
          updateRegionAttribute(rewardStructure.attrID[i], rewardStructure.isAwardForMaxLevel[i], rewardStructure.attrAmount[i]);
        }
      }
      pBarTarget = $("#regionCardsList #" + buttonCard.name + " .progressWrapper");
      pBarPercent = ((relevantTAttr.maxLevel - (relevantTAttr.maxLevel - relevantTAttr.level))/relevantTAttr.maxLevel)*100;
      setProgressBar(pBarTarget, pBarPercent, relevantTAttr.level, (relevantTAttr.maxLevel - relevantTAttr.level), "", relevantTAttr.maxLevel, 100);
      refreshRegionAttributes();
      saveGame();
      break;
    case "multiclickConverter":
      relevantTAttr = characterData.tempAttributes.filter(attr => attr.id == buttonCard.relevantTAttrID)[0];
      maxProgress = relevantTAttr.maxLevel;
      relevantTAttr.level++;
      if (relevantTAttr.level >= maxProgress) {
        let convertStructure = buttonCard.convertStructure[cardAttr.level];
        if (checkAffordableCostStructure(convertStructure)) {
          relevantTAttr.level = 0;
          let rewardStructure = buttonCard.rewardStructure[cardAttr.level];
          for (i = 0; i < convertStructure.attrID.length; i++) {
            let targetedAttributeIndex = characterData.attributes.findIndex(attr => attr.id == convertStructure.attrID[i]);
            updateRegionAttribute(convertStructure.attrID[i], false, -convertStructure.attrAmount[i]);
          }
          for (i = 0; i < rewardStructure.attrID.length; i++) {
            let targetedAttributeIndex = characterData.attributes.findIndex(attr => attr.id == rewardStructure.attrID[i]);
            updateRegionAttribute(rewardStructure.attrID[i], false, rewardStructure.attrAmount[i]);
          }
        }
        else {
          relevantTAttr.level = maxProgress - 1;
        }
      }
      pBarTarget = $("#regionCardsList #" + buttonCard.name + " .progressWrapper");
      pBarPercent = ((relevantTAttr.maxLevel - (relevantTAttr.maxLevel - relevantTAttr.level))/relevantTAttr.maxLevel)*100;
      setProgressBar(pBarTarget, pBarPercent, relevantTAttr.level, (relevantTAttr.maxLevel - relevantTAttr.level), "", relevantTAttr.maxLevel, 100);
      refreshRegionAttributes();
      saveGame();
      break;
  }
}

function changeActiveRegion(targetRegion, overrideSame = false) {
  if (activeRegion == targetRegion && !overrideSame) {
    console.log("Not changing region - its the same region")
    return;
  }
  $('#gamePage').block({ message: "Loading region... Waiting for server...", css: {backgroundColor: 'transparent', border: 'none', color: 'white'} });
  $("#regionAttributesList").empty();
  //$("#regionUpgradesList").empty(); //WHAT IS THIS UL FOR?
  $("#regionCardsList").empty();
  
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
changeActiveRegion(activeRegion, true);
queueAfterLoadStatus(updateClickCounter);
queueAfterLoadStatus(checkPassives);