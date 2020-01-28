const verboseLogging = false;
const updateInterval = 1000;

const servPort = 80;
const mongoosePath = "mongodb://127.0.0.1/coc";

console.log("[Info] Server starting...");

//Imports & Requires
const Confirm = require('prompt-confirm');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
const mTools = require('./mongooseTools.js');
const jsonfile = require('jsonfile');
const csvParse = require('csv-parse');
const fs = require('fs');

var gAttrs = [];
var attrs = [];
var finishedLoadingData = 3; //decrement upon loading each csv/json. at 0 is finished

//Helper function for logging primarily objects or large arrays
function dataLog(data) {
  console.log("--------------------");
  console.log(data);
  console.log("--------------------");
}

//Setup Mongoose Connection to MongoDB
console.log("[Notice] MongoDB must already be running... Attempting DB Connection");
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

try {
  mongoose.connect(mongoosePath, { useNewUrlParser: true, useUnifiedTopology: true } );
} catch (err) {
  console.log("[ERROR] Error while connecting to MongoDB at " + mongoosePath);
  console.log(err);
}
console.log("[Info] Successfully connected to MongoDB at " + mongoosePath);

//Set mongoose flag to fix deprecation warning
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);


//Define mongoose schema
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  pass: String,
  lastSeen: Date,
  attributes: [{
    id: Number,
    level: Number,
    maxLevel: Number,
    visible: Boolean,
    protected: Boolean
  }]
});

const globalAttributesSchema = new Schema({
  id: Number,
  name: String,
  sortOrder: Number,
  level: Number,
  visible: Boolean
});


const User = mongoose.model('Users', userSchema);
const GlobalAttributes = mongoose.model('GlobalAttributes', globalAttributesSchema);

var newUserAttributes = [];
var cardsArray = [];

function BlankUser(username, pass) {
  this.username = username;
  this.pass = pass;
  this.lastSeen = new Date();
  this.attributes = newUserAttributes;
}

function BlankGlobalAttribute(id, initialLevel, initialVisibility) {
  this.id = id;
  this.level = initialLevel;
  this.visible = initialVisibility;
}

//Using Pug as templating engine
app.set('view engine', 'pug');

//Serve files in public folder statically
app.use(express.static('public'));

//In /, render the index template
app.get('/', function (req, res) {
  res.render('index');
});

function batchLoadDBObjects(schemaObject, arrayOfSourceObjects) {
  for (i=0; i<arrayOfSourceObjects.length; i++) {
    mTools.newObject(schemaObject, arrayOfSourceObjects[i], {}, function(cbParams) { console.log("[Info] New Object Created!"); });
  }
}

//Should not have to be run every time - just when want a fresh DB.
function initializeDatabase() {
  //Drop collections
  mTools.dropCollection(GlobalAttributes, "GlobalAttributes", {}, function(cbParams) { console.log("[Info] Collection  GlobalAttributes dropped!"); });
  try {
    mTools.dropCollection(User, "Users", {}, function(cbParams) { console.log("[Info] Collection Users dropped!"); });
  } catch (e) {
    console.log("[Notice] Users collection not dropped.");
  }

  //Load GlobalStats Objects
  let newGSArr = [];
  newGSArr.push(new BlankGlobalAttribute(-1, 0, true)); //Global Clicks
  newGSArr.push(new BlankGlobalAttribute(-2, 0, true)); //Global Level
  newGSArr.push(new BlankGlobalAttribute(-3, 0, false)); //Global Ascensions
  batchLoadDBObjects(GlobalAttributes, newGSArr);

  checkListening();
}

function checkListening() {
  //Load Upgrades
  cardsArray = jsonfile.readFileSync('./public/json/cards.json');
  //Load CSVs
  csvParse(fs.readFileSync(__dirname+'/public/csv/gAttributes.csv'), {delimiter: '|', columns: true, cast: true}, function (err, output) {
    console.log("[Info] Loading Global Attributes CSV!");
    gAttrs = output;
    finishedLoadingData--;
    console.log(gAttrs);
  });
  csvParse(fs.readFileSync(__dirname+'/public/csv/attributes.csv'), {delimiter: '|', columns: true, cast: true}, function (err, output) {
    console.log("[Info] Loading Attributes CSV!");
    attrs = output;
    finishedLoadingData--;
    console.log(attrs);
  });
  csvParse(fs.readFileSync(__dirname+'/newUserAttributes.csv'), {delimiter: '|', columns: true, cast: true}, function (err, output) {
    console.log("[Info] Loading New User Attributes CSV!");
    newUserAttributes = output;
    finishedLoadingData--;
    console.log(newUserAttributes);
  });;

  startListening();
}

function startListening() {
  if (finishedLoadingData > 0) {
    console.log("[Info] waiting on finishedLoadingData to startListening: " + finishedLoadingData);
    setTimeout(startListening, 100);
    return;
  }
  //Start server listening for web requests
  console.log("[Notice] Server opening on port " + servPort);
  server.listen(servPort);
}

//*/
checkListening();
setInterval(emitGlobalStatsToAll, updateInterval);
/*/
//*
const prompt = new Confirm('[CRITICAL] (Re-)Initialize Database? This will wipe any existing accounts, stats, etc!');
prompt.ask(function(answer) {
  if (answer) {
    console.log("[Notice] (Re-)Initializing Database...");
    initializeDatabase();
  }
  else {
    console.log("[Notice] Loading Existing Database...");
  }
  //Send updates to all connected at given interval (default 10/s)
  checkListening();
  setInterval(emitGlobalStatsToAll, updateInterval);
});//*/

function emitGlobalStatsToAll() {
  if (verboseLogging === true) {
    console.log("[Verbose] Emitting Global Stats");
  }
  //function(targetObjectModel, findCriteria, keysAndValuesToUpdate, cb) {
  mTools.getObject(GlobalAttributes, {}, {emissionName: "gAttrUpdate", ioObject: io}, function(resultArray, cbParams) {
    let spooledEmissionData = [];
    for(i=0;i<resultArray.length;i++) {
      if (resultArray[i].visible === true) {
        spooledEmissionData.push(resultArray[i]);
      }
    }
    cbParams.ioObject.emit(cbParams.emissionName, {data: spooledEmissionData});
  });
}

//mTools.getObject: function(targetObjectModel, findCriteria, cbParameters, cb) {
function emitUserUpdate(roomName, username, emissionName = "actionResponse", alsoEmit = {}) {
  mTools.getObject(User, {username: username}, {emissionName: emissionName, roomName: roomName, username: username, ioObject: io, verboseLogging: verboseLogging}, function(resultArray, cbParams) {
    if (resultArray !== null) {
      if (resultArray.length > 1) {
        console.log("[Warn] User Object requested but multiple found for same username: " + resultArray[0].username);
        console.log(resultArray);
      }
      else {
        if (cbParams.verboseLogging) {
          console.log("[Verbose] Emitting update for user: " + cbParams.username);
        }
        io.in(cbParams.roomName).emit(emissionName, {userData: resultArray[0], other: alsoEmit});
      }
    }
    else {
      console.log("[Warn] User Object requested but none found! Username: " + cbParams.username);
    }
  });
}

//Handle new socket connection
io.on('connection', function (socket) {
  //On new connection, emit an 'establish' packet to client with server port to make sure connection is correct
  socket.emit('establish', { port: ":" + servPort });

  //After client recieves establish, it will send 'acknowledge' with confirmation of connection establishment on expected port, printing a warning if nonstandard, then sending 'receipt' confirmation based on that
  socket.on('acknowledge', function (data) {
    if (data.confirmation) {
      console.log("[Info] New connection established. Sending receipt");
      socket.emit('receipt', { confirmation: true });
    }
    else {
      console.log("[Warn] New connection attempted, but acknowledgement non-standard. Expected confirmation: true, received: ");
      dataLog(data);
      console.log("[Notice] Sending negative receipt");
      socket.emit('receipt', { confirmation: false });
    }
  });

  //When client attempts to 'logout' they will be gracefully removed from the io room. If all instances of that user are removed from the room the room closes.
  socket.on('logoutUser', function (data) {
    try {
      console.log("-----");
      console.log("[Info] User attempting smooth logout: " + data.username);
      console.log("[Info] Number of users in this account's room now: " + (Object.keys(io.sockets.adapter.rooms["user_" + data.username].sockets).length - 1)); //lists all users in room
      socket.leave(("user_" + data.username));
      console.log("[Info] Number of unique accounts connected now: " + (Object.keys(io.sockets.adapter.rooms).length)); //lists all rooms
      console.log("[Notice] Above numbers may be +- 1 due to time delay in socket.io flushing user/room changes");
      console.log("-----");
    }
    catch(err) {
      console.log(err)
    }
  });

  // When client attempts to 'login' they will send credentials which will be checked against existing users. Will notify user if wrong password provided for existing account. If no account found, user will automatically have an account generated.
  socket.on('verifyLogin', function (data) {
    console.log("-----");
    console.log("[Info] User attempting to login with ID: '" + data.username + "'");
    mTools.getObject(User, {username: data.username}, {username: data.username, pass: data.pass, socket: socket, BlankUser: BlankUser, io: io}, function(resultArray, cbParams) {
      if (resultArray === null || resultArray.length == 0) { //then user not found, need to create
        console.log("[Info] No credentials found for user '" + cbParams.username + "'. Making new user.");
        //function BlankUser(username, pass, schemaVersion) {
        //newObject: function(model, sourceObject, cbParameters, cb) {
        let newUser = new cbParams.BlankUser(cbParams.username, cbParams.pass);
        mTools.newObject(User, newUser, {}, function (cbP) { console.log("[Info] New user object added to DB." )});
        let socket = cbParams.socket;
        let newRoomName = "user_" + cbParams.username;
        socket.join((newRoomName));
        socket.leave(socket.id);
        setTimeout(emitUserUpdate, 2000, newRoomName, cbParams.username, emissionName = "loginSuccess");
        console.log("[Info] User created an logged in successfully: " + cbParams.username);
        console.log("[Info] Number of users in this account's room now: " + (Object.keys(cbParams.io.sockets.adapter.rooms[newRoomName].sockets).length)); //lists all users in room
        console.log("[Info] Number of unique accounts connected now: " + (Object.keys(cbParams.io.sockets.adapter.rooms).length)); //lists all rooms
        console.log("[Notice] Above numbers may be +- 1 due to time delay in socket.io flushing user/room changes");
      }
      else { //user found, send update if pass correct
        console.log("[Info] Credentials found for user '" + cbParams.username + "'. Attempting login.");
        let foundUser = resultArray[0];
        if (foundUser.pass == cbParams.pass) {
          let socket = cbParams.socket;
          let newRoomName = "user_" + foundUser.username;
          socket.join((newRoomName));
          socket.leave(socket.id);
          setTimeout(emitUserUpdate, 2000, newRoomName, foundUser.username, emissionName = "loginSuccess");
          console.log("[Info] User logged in successfully: " + foundUser.username);
          console.log("[Info] Number of users in this account's room now: " + (Object.keys(cbParams.io.sockets.adapter.rooms[newRoomName].sockets).length)); //lists all users in room
          console.log("[Info] Number of unique accounts connected now: " + (Object.keys(cbParams.io.sockets.adapter.rooms).length)); //lists all rooms
          console.log("[Notice] Above numbers may be +- 1 due to time delay in socket.io flushing user/room changes");

        }
        else {
          console.log("[Info] Invalid password for user '" + cbParams.username + "'. Rejecting login.")
          socket.emit('loginFailure', { message: "Wrong Password" });
        }
      }
    });
  });


  socket.on('gameStatusUpdate', function (data) {
    let interval = 10000;
    let clicksAllowedInInterval = 200;
    let username;
    //TODO: If last received update from user within 10 seconds, ignore request
    try {
      username = Object.keys(io.sockets.adapter.sids[socket.id])[0].substr(5);
    } catch (e) {
      console.log("Error getting username from clickUpdate");
      console.log(e);
    }
    if (username !== undefined) {
      let clicks = data.clicksSinceLast;
      //CRITICAL TODO FIXME: VALIDATE data.attributes FUNCTION (Also use in attemptAction/upgradePurchaseAttempt - will send attributes along and will want to validate in a similar way before using the sent attrs as they will have the latest data on everything)
      //validate function accepts the userAttributes array (within mTools.getObject) and the newAttrs array from the client, and will return the same array after mapping across it, looking up level updates in the newAttrs array for all VISIBLE, NON-PROTECTED attributes within userAttributes
      let attributes = data.attributes;
      clicks = clicks > clicksAllowedInInterval ? clicksAllowedInInterval : clicks;
      if(verboseLogging) {
        console.log("-----");
        console.log("[Verbose] User (" + username + ") sent " + clicks + " clicks accumulated over the last minute." + (clicks == clicksAllowedInInterval ? " Rate Limiting to " + clicksAllowedInInterval + "." : ""));
      }
      mTools.updateObject(GlobalAttributes, {id: -1}, [{ '$inc': {'level': clicks}}], function(err, object) {return;});
      mTools.updateObject(User, {username: username}, [{attributes: attributes}], function (err, object) {
        if(err){console.log(err);}
        //else{console.log(object);}
        this.emitUserUpdate("user_" + this.username, this.username, "clicksConfirmed", {clicks: clicks});
      }.bind({emitUserUpdate: emitUserUpdate, username: username}));
      // socket.emit('clicksConfirmed', { message: "Confirmed " + clicks + " clicks." });
    }
    else {
      console.log("[CRITICAL] RECEIVED GAMESTATUSUPDATE FROM UNPARSEABLE USERNAME. FULL KEYS LIST BELOW:");
      console.log(Object.keys(io.sockets.adapter.sids[socket.id]));
    }
  });
  
  socket.on('attemptAction', function (data) {
    //TODO: Set up a rate limit for these requests - dropping when over
    //Pull username out of the room name the socket is in
    var username = Object.keys(io.sockets.adapter.sids[socket.id])[0].substr(5);
    if(verboseLogging) {
      console.log("-----");
      console.log("[Verbose] User (" + username + ") attempted an action: " + data.name);
    }
    //Based on the name of the action, select the appropriate response
    switch(data.name) {
      case "attributeUpdate":
        mTools.getObject(User, {username: username}, {attributes: data.args.attributes, mTools: mTools, User: User, username: username}, function(arrRes, params) {
          let newAttrArray = arrRes[0].attributes.map(function (storedAttr) {
            let filteredAttrs = params.attributes.filter(attr => attr.id == storedAttr.id);
            if (filteredAttrs.length !== 1) {
              return storedAttr;
            }
            let newAttr = filteredAttrs[0];
            let newLevel = newAttr.level > storedAttr.maxLevel ? storedAttr.maxLevel : newAttr.level;
            storedAttr.level = newLevel;
            return storedAttr;
          });
          params.mTools.updateObject(params.User, {username: params.username}, [{attributes: newAttrArray}], function(err, object) {if(err){console.log(err);}else{}});
        });
        setTimeout(emitUserUpdate, 2000, "user_" + username, username);
        break;
      case "upgradePurchaseAttempt":
        let targetCardName = data.args.cardName;
        let foundCard = cardsArray.filter(card => card.name == data.args.cardName)[0];
        if (foundCard === undefined) {
          //TODO: complain to client or at least in the server log
        }
        else {
          mTools.getObject(User, {username: username}, {io: io, mTools: mTools, User: User, username: username, card: foundCard}, function(arrRes, params) {
            let attributesOwned = arrRes[0].attributes;
            let currentCardLevel = attributesOwned.filter(attr => attr.id == params.card.attributeID)[0].level;
            let unlocked = checkUnlockStructure(attributesOwned, params.card.unlockStructure, currentCardLevel);
            if (unlocked) {
              let appliedCosts = attemptApplyCostStructure(attributesOwned, params.card.costStructure, currentCardLevel);
              if (appliedCosts !== undefined) {
                let appliedRewards = attemptApplyRewardStructure(appliedCosts, params.card.rewardStructure, currentCardLevel, params.card.attributeID);
                params.mTools.updateObject(params.User, {username: params.username}, [{attributes: appliedRewards}],
                  function(err, object) {
                    if(err){console.log(err);}
                    //else{console.log(object)}
                    this.emitUserUpdate("user_" + this.username, this.username);
                  }.bind({emitUserUpdate: emitUserUpdate, username: username}));
              }
              else {
                console.log("cant afford")
              }
            }
            else {
              console.log("not unlocked")
            }
          });
        }
        break;
    }
  });
});

function attemptApplyRewardStructure(appliedCosts, rewardStructure, currentLevel, cardAttrID) {
  //NOTE: Don't forget to increment the level of the card's attribute itself!
  //I expect this will basically just copy the two below for the most part
  let appliedRewards = appliedCosts;
  let rewardLevel = rewardStructure[currentLevel];
  appliedRewards.filter(attr => attr.id == cardAttrID)[0].level++;
  for (var i = 0; i < rewardLevel.attrID.length; i++) {
    if (rewardLevel.isAwardForMaxLevel[i]) {
      // console.log(appliedRewards)
      // console.log(rewardLevel)
      // console.log(rewardLevel.attrID[i])
      // console.log(appliedRewards.filter(attr => attr.id == rewardLevel.attrID[i]))
      appliedRewards.filter(attr => attr.id == rewardLevel.attrID[i])[0].maxLevel += rewardLevel.attrAmount[i];
    }
    else {
      appliedRewards.filter(attr => attr.id == rewardLevel.attrID[i])[0].level += rewardLevel.attrAmount[i];
    }
  }
  // console.log("appliedRewards")
  // console.log(appliedRewards)
  return appliedRewards;
}

function attemptApplyCostStructure(attributesOwned, costStructure, currentLevel) {
  let newAttrArray = attributesOwned;
  let affordable = true;
  let costLevel = costStructure[currentLevel];
  for (var i = 0; i < costLevel.attrID.length; i++) {
    if (costLevel.isTempAttr[i]) {
      console.log("[CRITICAL] in attemptApplyCostStructure: costLevel.isTempAttr is true! Temp attribute purchases should not be querying the server! costLevel below:");
      dataLog(costLevel);
    }
    else {
      let targetAttributeIndex = newAttrArray.findIndex(attr => attr.id == costLevel.attrID[i]);
      newAttrArray[targetAttributeIndex].level -= costLevel.attrAmount[i];
      affordable = newAttrArray[targetAttributeIndex].level >= 0 ? true : false;
    }
  }
  // console.log("affordable")
  // console.log(affordable)
  // console.log(newAttrArray)
  return affordable ? newAttrArray : undefined;
}

function checkUnlockStructure(attributesOwned, unlockStructure, currentLevel) {
  let unlocked = true;
  let unlockLevel = unlockStructure[currentLevel];
  for (var i = 0; i < unlockLevel.attrID.length; i++) {
    let targetAttribute = attributesOwned.filter(attr => attr.id == unlockLevel.attrID[i])[0];
    //NOTE: UNLOCK STRUCTURE IS EXCLUSIVELY PERTAINING TO MAXLEVEL AS ITS MORE TRUSTWORTHY THAN LEVEL
    if (targetAttribute.maxLevel < unlockLevel.attrAmount[i]) {
      unlocked = false;
    }
  }
  // console.log("unlocked")
  // console.log(unlocked)
  return unlocked;
}