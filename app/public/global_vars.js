//Toggles whether looks at cookies for region information or from the blank template.
const resetCookies = true;
// $('#gamePage').block({ message: "Loading assets...", css: {backgroundColor: 'transparent', border: 'none', color: 'white'} });
var loadStatus = 5; //on 0 will enable game, each critical component should subtract 1

function clearCookies() {
  Cookies.remove("activeRegion");
  Cookies.remove("username");
  Cookies.remove("cloudsavePass");
  Cookies.remove("cData");
  
}
if (resetCookies) {
  clearCookies();
}

//Color Stuff
//standardColors:
var gold = "#fcf003";
var diamond_teal = "#34c9eb";
var white = "#ffffff";
var black = "#000000";
var blue = "#0037ff";
var green = "#19bf37";
var red = "#ff2200";
var orange = "#f0aa07";
var dark_purple = "#a10080";
var top_grey = "#545454";
var dark_grey = "#3b3b3b"; //7a7a7a
var light_grey = "#b3b3b3";

var allColors = [gold, diamond_teal, white, black, blue, green, red, orange, dark_purple, top_grey, dark_grey, light_grey];

//backgroundColor
var backgroundColor = dark_grey;

//Game Stuff
var activeRegion = Cookies.get("activeRegion") !== undefined ? Cookies.get("activeRegion") : "Core";
Cookies.set("activeRegion", activeRegion);

//Socket Stuff
const servPort = ":80";
var socket; //the socket communicated on - assigned in sockets.js

//Clicks Counter (sent in 1 minute intervals)
var clickCounter = 0;
var timeLastSentStatus = new Date();

//Character Data
let loadedCData;
var characterData;
function resetCharacterData() {
  loadedCData = Cookies.get("cData");
  characterData = {
    attributes: [],
    tempAttributes: []
  };
  if (loadedCData !== undefined && resetCookies === false) {
    console.log("Character Data loaded from cookies.");
    characterData = JSON.parse(loadedCData);
    loadStatus--;
    console.log("loadStatus: " + loadStatus);
  }
  else {
    papaParseCSV(updateTAttrInfo, "tempAttributes");
  }
}
resetCharacterData();

var cards = [];
//Note: If JSON not loaded, card.json needs to be validated as it is most likely misshapen somewhere
$.getJSON('/json/cards.json', function(json) { console.log("Cards JSON Loaded"); cards = json; loadStatus--; console.log("Load Status: " + loadStatus); });

var attrInfo = [];
var tAttrInfo = [];
var gAttrInfo = [];

//TODO: bother abstracting this function
function updateAttrInfo(newArr) {
  attrInfo = newArr;
}

function pushToCDataTAttrs(objectToPush) {
  characterData.tempAttributes.push(objectToPush);
}

function updateCDataTAttrs(newArr) {
  characterData.tempAttributes = [];
  //THIS SETS UP THE STRUCTURE FOR tempAttributes
  newArr.forEach(attr => pushToCDataTAttrs(attr));
}

function updateTAttrInfo(newArr) {
  tAttrInfo = newArr;
  updateCDataTAttrs(newArr);
}

function updateGAttrInfo(newArr) {
  gAttrInfo = newArr;
}

function papaParseCSV(targetUpdateFunction, filename) {
  Papa.parse("/csv/" + filename + ".csv", {
    header: true,
    dynamicTyping: true,
    download: true,
    delimiter: "|",
    keepEmptyRows: false,
    skipEmptyLines: true,
    complete: function (results) {
      console.log(filename + " CSV Loaded");
      targetUpdateFunction(results.data);
      // targetVariable = results.data;
      loadStatus--;
      console.log("Load Status: " + loadStatus);
    }
  });
}

papaParseCSV(updateAttrInfo, "attributes");
papaParseCSV(updateGAttrInfo, "gAttributes");

//Save Game
function saveGame() {
  Cookies.set("cData", JSON.stringify(characterData));
}

// //Cookies.get("activeRegion") !== undefined ? Cookies.get("activeRegion") : "Singularity";
// let loadedRegions = Cookies.get("regions");
// var regions = [];
// if (loadedRegions !== undefined && resetCookies === false) {
//   console.log("Regions loaded from cookies");
//   regions = JSON.parse(loadedRegions);
//   loadStatus--;
//   console.log("Load Status: " + loadStatus);
//   //TODO: set progressBars to correct percentage upon load
// }
// else {
//   // regions = JSON.parse($.ajax({
//   //   type: 'GET',
//   //   url: 'region_templates.json',
//   //   dataType: 'json',
//   //   success: function() {},
//   //   data: {},
//   //   async: false}));
//   $.getJSON('region_templates.json', function (json) { console.log("Regions JSON Loaded"); regions = json; loadStatus--; console.log("Load Status: " + loadStatus); });
// }
