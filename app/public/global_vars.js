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
var activeRegion = Cookies.get("activeRegion") !== undefined ? Cookies.get("activeRegion") : "Singularity";
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
  upgrades: [],
  items: [],
  currencies: []
};
if (loadedCData !== undefined) {
  console.log("Character Data loaded from cookies.");
  characterData = JSON.parse(loadedCData);
  console.log(characterData.currencies)
}

/*characterData {
 * * upgrades: [{
 * * * name
 * * * level
 * * }]
 * * items: [{
 * * * name
 * * * amount
 * * }]
 * * currencies: [{
 * * * name
 * * * amount
 * * * maxAmount
 * * }]
*/

//Save Game
function saveGame() {
  Cookies.set("cData", JSON.stringify(characterData));
  Cookies.set("regions", JSON.stringify(regions));
}

//Regions
function Region(name, features) {
  this.name = name;
  this.features = features;
}

//Cookies.get("activeRegion") !== undefined ? Cookies.get("activeRegion") : "Singularity";
let loadedRegions = Cookies.get("regions");
var regions = [];
if (loadedRegions !== undefined) {
  console.log("Regions loaded from cookies");
  regions = JSON.parse(loadedRegions);
  //TODO: set progressBars to correct percentage upon load
}
else {
  regions = JSON.parse($.ajax({
    type: 'GET',
    url: 'region_templates.json',
    dataType: 'json',
    success: function() {},
    data: {},
    async: false}));
}
//Upgrades/Items/Currencies
// const upgradesList = [{
//   name: ,
//   maxLevel:
// }, {
  
// }]