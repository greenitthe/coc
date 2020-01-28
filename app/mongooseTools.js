/*
Tools for using a standard model with mongoose
*/

module.exports = {
  newObject: function(model, sourceObject, cbParameters, cb) {
    console.log("[Info] Creating new object.");
    let newObject = new model(sourceObject);
    newObject.save(function(err) {
      if (err) {
        console.log(err);
        return;
      }
      
      this.cb(cbParameters);
    }.bind({cb: cb, cbParameters: cbParameters}));
  },
  dropCollection: function(modelToDrop, collectionName, cbParameters, cb) {
    console.log("[Warn] Dropping collection named: " + collectionName);
    modelToDrop.collection.drop(function(err, result) {
      if (err) {
        console.log(err);
        return;
      }
      
      this.cb(cbParameters);
    }.bind({cb: cb, cbParameters: cbParameters}));
  },
  updateObject: function(targetObjectModel, findCriteria, keysAndValuesToUpdate, cb) {
    //cb(err, object)
    keysAndValuesToUpdate.forEach(element => targetObjectModel.findOneAndUpdate(findCriteria, element, cb));
  },
  deleteObject: function(targetObjectModel, findCriteria, cb) {
    //cb(err)
    targetObjectModel.findOneAndRemove(findCriteria, cb);
  },
  getObject: function(targetObjectModel, findCriteria, cbParameters, cb) {
    targetObjectModel.find(findCriteria).exec(function(err, resultArray) {
      if (err) {
        console.log("[Warn] Error getting requested object with given criteria:");
        console.log(findCriteria)
      }
      else if(resultArray === null || resultArray.length === 0) {
        console.log("[Warn] Could not find any objects based on given criteria:");
        console.log(findCriteria);
        this.cb([], cbParameters);
      }
      else {
        //console.log("[Info] Found at least one object based on given criteria: " + findCriteria);
        this.cb(resultArray, cbParameters);
      }
    }.bind({cb: cb, cbParameters: cbParameters}));
  }
}