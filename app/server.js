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
const csvParser = csvParse({delimiter: '|'}, function(err, data) {
  console.log(data);
});

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
    level: Number
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

function BlankUser(username, pass) {
  this.username = username;
  this.pass = pass;
  this.lastSeen = new Date();
  this.attributes = [{
    id: 0,
    level: 0
  }];
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
  id, initialLevel, initialVisibility
  newGSArr.push(new BlankGlobalStat(-1, 0, true)); //Global Clicks
  newGSArr.push(new BlankGlobalStat(-2, 0, true)); //Global Level
  newGSArr.push(new BlankGlobalStat(-3, 0, false)); //Global Ascensions
  batchLoadDBObjects(GlobalAttributes, newGSArr);

  //Load Upgrades
  //var upgradesArray = jsonfile.readFileSync('./public/upgrades.json');
  //batchLoadDBObjects(Upgrade, upgradesArray);

  startListening();
}

function startListening() {
  //upgradesList = jsonfile.readFileSync('./public/upgrades.json');
  console.log("gAttributes")
  fs.createReadStream(__dirname+'/public/csv/gAttributes.csv').pipe(csvParser);
  console.log("attributes")
  fs.createReadStream(__dirname+'/public/csv/gAttributes.csv').pipe(csvParser);

  //Start server listening for web requests
  console.log("[Notice] Server opening on port " + servPort);
  server.listen(servPort);
}

//*/
startListening();
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
  startListening();
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
function emitUserUpdate(roomName, username, emissionName = "actionResponse") {
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
        io.in(cbParams.roomName).emit(emissionName, resultArray[0]);
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
        let newUser = new cbParams.BlankUser(cbParams.username, cbParams.pass, "v0.01");
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

  socket.on('clickUpdate', function (data) {
    //TODO: If last received clickUpdate from user within 50 seconds, ignore request
    try {
      let username = Object.keys(io.sockets.adapter.sids[socket.id])[0].substr(5);
    } catch (e) {
      console.log("Error getting username from clickUpdate");
      console.log(e);
    }
    let clicks = data.clicksLastMinute;
    clicks = clicks > 600 ? 600 : clicks;
    if(verboseLogging) {
      console.log("-----");
      console.log("[Verbose] User (" + username + ") sent " + clicks + " clicks accumulated over the last minute." + (clicks == 600 ? " Rate Limiting to 600." : ""));
    }
    mTools.updateObject(GlobalStats, {name: "Total Clicks"}, [{ '$inc': {'value': clicks}}], function(err, object) {return;});
    socket.emit('clicksConfirmed', { message: "Confirmed " + clicks + " clicks." });
  });

  socket.on('attemptAction', function (data) {
    //Pull username out of the room name the socket is in
    var username = Object.keys(io.sockets.adapter.sids[socket.id])[0].substr(5);
    if(verboseLogging) {
      console.log("-----");
      console.log("[Verbose] User (" + username + ") attempted an action.");
    }
    //Based on the name of the action, select the appropriate response
    switch(data.name) {
      case "currencyUpdate":
        mTools.getObject(User, {username: username}, {currencies: data.args.currencies, mTools: mTools, User: User, username: username}, function(arrRes, params) {
          let newArr = arrRes[0].currencyBags.map(function (cB) {
            let filteredCurrs = params.currencies.filter(curr => curr.name == cB.name);
            if (filteredCurrs.length == 0) {
              return cB;
            }
            let newC = filteredCurrs[0];
            //let combinedAmounts = newC.amount + cB.amount;
            let newAmount = newC.amount > cB.maxAmount ? cB.maxAmount : newC.amount;
            cB.amount = newAmount;
            return cB;
          });
          params.mTools.updateObject(params.User, {username: params.username}, [{currencyBags: newArr}], function(err, object) {if(err){console.log(err);}else{console.log(object)}});
        });
        setTimeout(emitUserUpdate, 2000, "user_" + username, username);
        break;
      case "upgradePurchase":
        let targetUpgrade = data.args.upgradeName;
        let foundUpgrade = upgradesList.filter(upgrade => upgrade.name == targetUpgrade)[0];
        if (foundUpgrade === undefined) {
          //TODO: complain to client or at least in the server log
        }
        else {
          mTools.getObject(User, {username: username}, {io: io, mTools: mTools, User: User, username: username, foundUpgrade: foundUpgrade}, function(arrRes, params) {
            let foundUpgrade = params.foundUpgrade;
            let upgradeOwned = arrRes[0].upgradesOwned.filter(upgrade => upgrade.name == foundUpgrade.name)[0];
            if (upgradeOwned === undefined) {
              //UPGRADE UNOWNED, CHECK FOR VALIDITY THEN ADD TO USER LIST
            }
            else {
              let unlocked = true;
              let unlockStructure = foundUpgrade.unlockStructure[upgradeOwned.level];
              for (var i = 0; i < unlockStructure.criteriaNames.length; i++) {
                let criteriaResponseValue;
                switch(unlockStructure.criteriaTypes[i]) {
                  case "MaxCurrency":
                    let criteriaResponseValue = arrRes[0].currencyBags.filter(curr => curr.name == unlockStructure.criteriaNames[i])[0].maxAmount;
                    break;
                }
                if (criteriaResponseValue < unlockStructure.criteriaAmounts[i]) {
                  unlocked = false;
                }
              }
              //console.log("Unlocked?: " + unlocked);
              if (unlocked) { //then check if upgrade is possible
                let costStructure = foundUpgrade.costStructure[upgradeOwned.level];
                let newCBArray = arrRes[0].currencyBags;
                let affordable = true;
                for (var i = 0; i < costStructure.currencyNames.length; i++) {
                  //todo: wrap all this junk in try...catches to not crash when users send nonsense
                  let targetCurrency = newCBArray.filter(curr => curr.name == costStructure.currencyNames[i])[0];
                  if (targetCurrency.amount >= costStructure.currencyAmounts[i]) {
                    targetCurrency.amount = targetCurrency.amount - costStructure.currencyAmounts[i];
                  }
                  else {
                    affordable = false;
                  }
                }
                if (affordable) {
                  let newUpgradesArray = arrRes[0].upgradesOwned.map(function(item) {
                    let newItem = item;
                    newItem.level = item.name == foundUpgrade.name ? item.level + 1 : item.level;
                    return newItem;
                  });
                   // newCBArray[0].amount = 5;
                   // newUpgradesArray[0].level = 0;

                  //Now handle adding the benefits of the upgrade:
                  let rewardStructure = foundUpgrade.rewardStructure[upgradeOwned.level-1];
                  for (var i = 0; i < rewardStructure.targetNames.length; i++) {
                    switch (rewardStructure.targetTypes[i]) {
                      case "MaxCurrency":
                        let rewardCurrency = newCBArray.filter(curr => curr.name == rewardStructure.targetNames[i])[0];
                        rewardCurrency.maxAmount = rewardStructure.targetAmounts[i];
                        break;
                      //TODO: add other cases
                    }
                  }

                  params.mTools.updateObject(params.User, {username: params.username}, [{currencyBags: newCBArray}, {upgradesOwned: newUpgradesArray}],
                    function(err, object) {
                      if(err){console.log(err);}
                      //else{console.log(object)}
                      this.emitUserUpdate("user_" + this.username, this.username);
                    }.bind({emitUserUpdate: emitUserUpdate, username: username}));
                  params.io.in("user_" + params.username).emit("upgradeConfirmed", {upgradeName: foundUpgrade.name});
                  // setTimeout(emitUserUpdate, 1000, "user_" + username, username);
                }
              }
            }
          });
        }
        break;
    }
  });
});
