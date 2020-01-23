setInterval(checkSendClicks, 10000);

function incrementClicks() {
  clickCounter = clickCounter++ >= 600 ? 600 : clickCounter++;
  updateClickCounter();
}

// function checkTimedReady(name) {
//   console.log("checkTimedReady: " + name);
//   sendAction("checkTimer", {regionName: activeRegion, timerName: name});
// }

// function buttonUsed(name) {
//   console.log("buttonUsed: " + name);
//   sendAction("checkButton", {regionName: activeRegion, buttonName: name});
// }

function changeActiveRegion(targetRegion) {
  $("#sidebar ul>li.active").removeClass("active");
  var navLink = $("#sidebar ul li ul li .sidebarButton:contains('" + targetRegion + "')");
  navLink.parent("li").addClass("active");
  navLink.parent("li").parent("ul").parent("li").addClass("active");
  activeRegion = targetRegion;
  Cookies.set("activeRegion", activeRegion);
  $("#regionName").text(activeRegion);
  $('#gamePage').block({ message: "Changing regions... Waiting for server...", css: {backgroundColor: 'transparent', border: 'none', color: 'white'} });
  sendAction("changeRegion", {});
}

//TODO: move activeRegion to server potentially for convenience
changeActiveRegion(activeRegion);