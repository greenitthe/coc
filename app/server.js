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
const jsonfile = require('jsonfile')

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
  schemaVersion: String,
  lastSeen: Date,
  upgradesOwned: [{
    name: String,
    level: Number
  }],
  itemInventory: [{
    name: String,
    amount: Number
  }],
  currencyBags: [{
    name: String,
    amount: Number,
    maxAmount: Number //Upgraded by upgrades and items, but the max is ultimately server side to reduce cheating
  }]
});

//Contains all valid upgrades - any Upgrade action is validated against this list.
const upgradeSchema = new Schema({
  name: String,
  schemaVersion: String,
  maxLevel: Number,
  costStructure: [{
    currencyNames: [String],
    currencyAmounts: [Number]
  }],
  unlockStructure: [{ //each object corresponds to the level #, same as costStructure so unlockStructure[1] is the unlock reqs for level 1
    criteriaNames: [String], //the arrays of each here correspond, so cNames[1], cTypes[1], and amounts[1] line up. all array items must validate to unlock
    criteriaTypes: [String], //Upgrade, MaxCurrency, or Item as of now - actual currency is invalid because they are ticked client-side
    criteriaAmounts: [Number]
  }]
});

//Contains all valid items - any Use Item or Purchase Item action is validated against this list.
//Again, item effects are handled client side
const itemSchema = new Schema({
  name: String,
  schemaVersion: String,
  //dropRate: Number //todo: find a better way to handle dropping items randomly to players
  stackSize: Number,
  sellValue: Number,
  buyValue: Number,
  marketCurrency: String
});

//The actual effects of each upgrade or item are handled on the client side. That said, when actions are sent to the server, some validation occurs
//Ex: If player hacks X upgrade which gives +100 gold/turn, but player doesn't have that upgrade purchased serverside, it won't go through
//Most upgrades should be contingent upon an action occuring that is validateable
//Thus unlocking an upgrade requires X other upgrades/items. Since items are dropped and ugprades are bought server-side, there are some hard blocks to hacking
//Note: Currencies would still technically be hackable, as would be cooldowns, but the effort involved is larger and frankly I dont care that much

//TODO: Global Effects

const globalStatsSchema = new Schema({
  name: String,
  sortOrder: Number,
  schemaVersion: String,
  value: Number,
  visible: Boolean
});


const User = mongoose.model('Users', userSchema);
const Upgrade = mongoose.model('Upgrades', upgradeSchema);
const Item = mongoose.model('Items', itemSchema);
const GlobalStats = mongoose.model('GlobalStats', globalStatsSchema);

function BlankUser(username, pass, schemaVersion) {
  this.username = username;
  this.pass = pass;
  this.schemaVersion = schemaVersion;
  this.lastSeen = new Date();
  this.upgradesOwned = [{
    name: "Core",
    level: 0
  }];
  this.itemInventory = [{
    name: "Dirt",
    amount: "0"
  }];
  this.currencyBags = [{
    name: "Energy",
    amount: 0,
    maxAmount: 5
  }];
}

//todo: make into constructor
//BlankUpgrade(name, schemaVersion, maxLevel, costStructure, unlockStructure) {
//  name: String;
//  schemaVersion: String;
//  maxLevel: Number;
//  costStructure:
//    [{
//     currencyNames: [String],
//     currencyAmounts: [Number]
//    }]
//  unlockStructure:
//    [{ //each object corresponds to the level #, same as costStructure so unlockStructure[1] is the unlock reqs for level 1
//     criteriaNames: [String], //the arrays of each here correspond, so cNames[1], cTypes[1], and amounts[1] line up. all array items must validate to unlock
//     criteriaTypes: [String], //Upgrade, MaxCurrency, or Item as of now - actual currency is invalid because they are ticked client-side
//     criteriaAmounts: [Number]
//    }]
function BlankUpgrade(name, schemaVersion, maxLevel, costStructure, unlockStructure) {
  this.name = name;
  this.schemaVersion = schemaVersion;
  this.maxLevel = maxLevel;
  this.costStructure = costStructure;
  this.unlockStructure = unlockStructure;
}

//todo: make into constructor
const blankItem = {
  name: "placeholder",
  schemaVersion: "v0.01",
  //dropRate: Number //todo: find a better way to handle dropping items randomly to players
  stackSize: -1,
  sellValue: -1,
  buyValue: -1,
  marketCurrency: "placeholder"
};

function BlankGlobalStat(name, sortOrder, schemaVersion, initialValue, visibility) {
  this.name = name;
  this.sortOrder = sortOrder;
  this.schemaVersion = schemaVersion;
  this.value = initialValue;
  this.visible = visibility;
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
  mTools.dropCollection(GlobalStats, "GlobalStats", {}, function(cbParams) { console.log("[Info] Collection  GlobalStats dropped!"); });
  try {
    mTools.dropCollection(User, "Users", {}, function(cbParams) { console.log("[Info] Collection Users dropped!"); });
  } catch (e) {
    console.log("[Notice] Users collection not dropped.");
  }
  mTools.dropCollection(Upgrade, "Upgrades", {}, function(cbParams) { console.log("[Info] Collection Upgrades dropped!"); });
  
  //Load GlobalStats Objects
  let newGSArr = [];
  newGSArr.push(new BlankGlobalStat("Clicks", 1, "v0.01", 0, true));
  newGSArr.push(new BlankGlobalStat("Level", 0, "v0.01", 0, true));
  newGSArr.push(new BlankGlobalStat("Ascensions", 2, "v0.01", 0, false));
  batchLoadDBObjects(GlobalStats, newGSArr);
  
  //Load Upgrades
  let upgradesArray = jsonfile.readFileSync('./upgrades.json');
  batchLoadDBObjects(Upgrade, upgradesArray);
  
  startListening();
}

function startListening() {
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
  setInterval(emitGlobalStatsToAll, updateInterval);
});//*/

function emitGlobalStatsToAll() {
  if (verboseLogging === true) {
    console.log("[Verbose] Emitting Global Stats");
  }
  //function(targetObjectModel, findCriteria, keysAndValuesToUpdate, cb) {
  mTools.getObject(GlobalStats, {schemaVersion: "v0.01"}, {emissionName: "GlobalStatsUpdate", ioObject: io}, function(resultArray, cbParams) {
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
    mTools.updateObject(GlobalStats, {name: "Clicks"}, [{ '$inc': {'value': clicks}}], function(err, object) {return;});
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
        //data.args.currencies;
        //name
        //amount
        //maxAmount
        mTools.getObject(User, {username: username}, {currencies: data.args.currencies, mTools: mTools, User: User, username: username}, function(arrRes, params) {
          let newArr = arrRes[0].currencyBags.map(function (cB) {
            let filteredCurrs = params.currencies.filter(curr => curr.name == cB.name);
            if (filteredCurrs.length == 0) {
              return cB;
            }
            let newC = filteredCurrs[0];
            let combinedAmounts = newC.amount + cB.amount;
            let newAmount = combinedAmounts > cB.maxAmount ? cB.maxAmount : combinedAmounts;
            cB.amount = newAmount;
            return cB;
          });
          // params.currencies.forEach(function(item) {
          //   let thisBag = arrRes[0].currencyBags.filter(curr => curr.name == item.name)[0];
          //   let curAmount = thisBag.amount;
          //   let maxAmount = thisBag.maxAmount;
          //   let newAmount = item.amount > maxAmount ? curAmount + maxAmount : curAmount + item.amount;
          //   let pushValue = { '$set':
          //     {'currencyBags.$.amount': newAmount}
          //   };
          //   updateKeyValues.push(pushValue);
          // });
          params.mTools.updateObject(params.User, {username: params.username}, [{currencyBags: newArr}], function(err, object) {if(err){console.log(err);}else{console.log(object)}});
        });
        emitUserUpdate("user_" + username, username);
        // const userSchema = new Schema({
        //   username: String,
        //   pass: String,
        //   schemaVersion: String,
        //   lastSeen: Date,
        //   upgradesOwned: [{
        //     name: String,
        //     level: Number
        //   }],
        //   itemInventory: [{
        //     name: String,
        //     amount: Number
        //   }],
        //   currencyBags: [{
        //     name: String,
        //     amount: Number,
        //     maxAmount: Number //Upgraded by upgrades and items, but the max is ultimately server side to reduce cheating
        //   }]
        // });
        break;
    }
  });
});