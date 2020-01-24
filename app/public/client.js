setInterval(checkSendClicks, 10000);

function incrementClicks() {
  clickCounter = clickCounter++ >= 600 ? 600 : clickCounter++;
  updateClickCounter();
}

// function checkTimedReady(name) {
//   console.log("checkTimedReady: " + name);
//   sendAction("checkTimer", {regionName: activeRegion, timerName: name});
// }

function buttonUsed(type, name) {
  let currentRegion = regions.filter(aRegion => aRegion.name == activeRegion)[0];
  let targetFeature = currentRegion.features.filter(aFeature => aFeature.name == name && aFeature.cardType == type)[0];
  switch (type) {
    case "progressBar":
      targetFeature.currentProgress++;
      let cProg = targetFeature.currentProgress;
      let pReq = targetFeature.progressRequired;
      if (cProg >= pReq - 0.1) {
        targetFeature.currentProgress = cProg = 0;
        targetFeature.onCompletion();
      }
      let percentPerProgress = (1/pReq)*100;
      targetFeature.actualPercent = percentPerProgress * cProg;
      let pBarHolder = $("#regionFeaturesList #" + name + " .progressWrapper");
      setProgressBar(pBarHolder, targetFeature.actualPercent, cProg, pReq - cProg, pReq, 100);
      break;
  }
  refreshRegion();
}

function changeActiveRegion(targetRegion) {
  $("#sidebar ul>li.active").removeClass("active");
  var navLink = $("#sidebar ul li ul li .sidebarButton:contains('" + targetRegion + "')");
  navLink.parent("li").addClass("active");
  navLink.parent("li").parent("ul").parent("li").addClass("active");
  activeRegion = targetRegion;
  Cookies.set("activeRegion", activeRegion);
  $("#regionName").text(activeRegion);
  $('#gamePage').block({ message: "Changing regions... Waiting for server...", css: {backgroundColor: 'transparent', border: 'none', color: 'white'} });
  refreshRegionAndUnblock();
}

//TODO: move activeRegion to server potentially for convenience
changeActiveRegion(activeRegion);