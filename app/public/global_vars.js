//Toggles whether looks at cookies for region information or from the blank template.
const resetTemplates = false;
// $('#gamePage').block({ message: "Loading assets...", css: {backgroundColor: 'transparent', border: 'none', color: 'white'} });
var loadStatus = 5; //on 0 will enable game, each critical component should subtract 1

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
var fullUpdateScheduled = true;

//Socket Stuff
const servPort = ":80";
var socket; //the socket communicated on - assigned in sockets.js

//Clicks Counter (sent in 1 minute intervals)
var clickCounter = 0;
var timeLastSentClicks = new Date();

//Character Data
let loadedCData = Cookies.get("cData");
var characterData = {
  attributes: [],
  tempAttributes: []
};
if (loadedCData !== undefined && resetTemplates === false) {
  console.log("Character Data loaded from cookies.");
  characterData = JSON.parse(loadedCData);
  loadStatus--;
}

var cards = [];
$.getJSON('/json/cards.json', function(json) { console.log("Cards JSON Loaded"); cards = json; loadStatus--; console.log("Load Status: " + loadStatus); });

//THESE ARENT WORKING. WORK IF ASYNC... (see below)

// var attrInfo = [];
// let attrFile = $.ajax({
//   type: 'GET',
//   url: 'csv/attributes.csv',
//   dataType: 'csv',
//   success: function () {},
//   data: {},
//   async: false
// });
// Papa.parse(attrFile, {
//   complete: function(results) {
//     console.log("Attributes CSV Loaded");
//     attrInfo = results;
//     loadStatus--;
//     console.log("Load Status: " + loadStatus);
//   }
// });
//
// var tAttrInfo = [];
// let tAttrFile = $.ajax({
//   type: 'GET',
//   url: 'csv/tempAttributes.csv',
//   dataType: 'csv',
//   success: function () {},
//   data: {},
//   async: false
// });
// Papa.parse(tAttrFile, {
//   complete: function(results) {
//     console.log("Temp Attributes CSV Loaded");
//     tAttrInfo = results;
//     loadStatus--;
//     console.log("Load Status: " + loadStatus);
//   }
// });

var attrInfo = [];
var tAttrInfo = [];
var gAttrInfo = [];

//TODO: bother abstracting this function
function updateAttrInfo(newArr) {
  attrInfo = newArr;
}

function pushToCDataTAttrs(objectToPush) {
  characterData.push(objectToPush);
}

function updateCDataTAttrs(newArr) {
  characterData.tempAttributes = [];
  //THIS SETS UP THE STRUCTURE FOR tempAttributes
  newArr.forEach(attr => pushToCDataTAttrs({id: attr.id, currentProgress: 0}));
}

function updateTAttrInfo(newArr) {
  tAttrInfo = newArr;
  updateCDataTAttrs;
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
papaParseCSV(updateTAttrInfo, "tempAttributes");
papaParseCSV(updateGAttrInfo, "gAttributes");

// Papa.parse("/csv/attributes.csv", {
//   header: true,
//   dynamicType: true,
//   download: true,
//   delimiter: "|",
//   complete: function (results) {
//     console.log("attrInfo CSV Loaded");
//     attrInfo = results.data;
//     loadStatus--;
//     console.log("Load Status: " + loadStatus);
//   }
// });

//Save Game
function saveGame() {
  Cookies.set("cData", JSON.stringify(characterData));
}

// //Cookies.get("activeRegion") !== undefined ? Cookies.get("activeRegion") : "Singularity";
// let loadedRegions = Cookies.get("regions");
// var regions = [];
// if (loadedRegions !== undefined && resetTemplates === false) {
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
