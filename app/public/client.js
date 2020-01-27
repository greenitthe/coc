setInterval(checkSendClicks, 10000);

function incrementClicks() {
  clickCounter = clickCounter++ >= 600 ? 600 : clickCounter++;
  updateClickCounter();
}

// function checkTimedReady(name) {
//   console.log("checkTimedReady: " + name);
//   sendAction("checkTimer", {regionName: activeRegion, timerName: name});
// }

function updateRegionAttribute(targetAttribute, incrementAmount = 1) {
  let referenceIndex = characterData.attributes.findIndex((item => item.id == targetAttribute));
  let reference = characterData.attributes[referenceIndex];
  if (reference.level + incrementAmount <= reference.maxLevel) {
    //characterData.attributes[referenceIndex].amount+=incrementAmount;
    reference.level+=incrementAmount;
  }
  //sendAction("currencyUpdate", {currencies: characterData.currencies});
  saveGame();
}

function checkAffordableCostStructure(attributes, costStructure) {
  let canAfford = true;
  costStructure.forEach(function(item, index) {
    let indexIfAvail = attributes.findIndex(item => item.id == item.attrID);
    if (indexIfAvail === -1 || attributes[indexIfAvail].level < item.attrAmount) {
      canAfford = false;
    }
  });
  return canAfford;
}

function buttonUsed(type, name) {
  incrementClicks();
  //currentRegion becomes regionCardsArr
  let regionCardsArr = cards.filter(card => card.region === activeRegion);
  //let targetFeature = currentRegion.features.filter(aFeature => aFeature.name == name && aFeature.cardType == type)[0];
  
  
  //FIXME: card.name is now nonsense, name stored in card.attributeID (attribute.name)
  
  
  let buttonCard = regionCardsArr.filter(card => card.name == name && card.type == type)[0];
  switch (type) {
    case "upgradeable":
      let canAfford = checkAffordableCostStructure(cData.attributes, targetFeature.costStructure);
      if (canAfford) {
        sendAction("upgradePurchaseAttempt", {cardName: name});
      }
      break;
    case "multiclickGatherer":
      //FIXME: Once cards actually display
      //targetFeature.
      break;
    // case "progressBar":
    //   targetFeature.currentProgress++;
    //   let cProg = targetFeature.currentProgress;
    //   let pReq = targetFeature.progressRequired;
    //   if (cProg >= pReq - 0.1) {
    //     targetFeature.currentProgress = cProg = 0;
    //     targetFeature.spendTarget !== "" ? lookupAndSpendCurrency(targetFeature.spendTarget, targetFeature.spendAmount) : "";
    //     updateCDataCurrency(targetFeature.currencyTarget, targetFeature.currencyAmount);
    //   }
    //   let percentPerProgress = (1/pReq)*100;
    //   targetFeature.actualPercent = percentPerProgress * cProg;
    //   let pBarHolder = $("#regionFeaturesList #" + name + " .progressWrapper");
    //   setProgressBar(pBarHolder, targetFeature.actualPercent, cProg, pReq - cProg, pReq, 100);
    //   break;
    // case "upgradeShop":
    //   var mUO = upgradeList.filter(upgrade => upgrade.name == targetFeature.upgradeTarget)[0];
    //   var oUO = characterData.upgrades.filter(upgrade => upgrade.name == targetFeature.upgradeTarget)[0];
    //   var canAfford = true;
    //   for(var i = 0; i < mUO.costStructure[oUO.level].currencyNames.length; i++) {
    //     let cName = mUO.costStructure[oUO.level].currencyNames[i];
    //     let targetCharCurr = characterData.currencies.filter(curr => curr.name == cName)[0];
    //     let currencyAmount = mUO.costStructure[oUO.level].currencyAmounts[i];
    //     if (targetCharCurr === undefined) { console.log ("Undiscovered currency needed for that purchase!"); }
    //     if ((targetCharCurr.maxAmount >= currencyAmount) && (targetCharCurr.amount >= currencyAmount)) {
    //       //cool can afford
    //     } else { canAfford = false; }
    //   }
    //   console.log("canAfford: " + canAfford);
    //   if (canAfford) {
    //     sendAction("upgradePurchase", {upgradeName: targetFeature.upgradeTarget});
    //   }
    //   break;
  }
  saveGame();
  refreshRegion();
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
