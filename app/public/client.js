setInterval(checkSendClicks, 10000);

function incrementClicks() {
  clickCounter = clickCounter++ >= 600 ? 600 : clickCounter++;
  updateClickCounter();
}

function checkTimedReady(name) {
  console.log("checkTimedReady: " + name);
  sendAction("checkTimer", {regionName: activeRegion, timerName: name});
}

function buttonUsed(name) {
  console.log("buttonUsed: " + name);
  sendAction("checkButton", {regionName: activeRegion, buttonName: name});
}