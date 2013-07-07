
var _ = require('underscore')
var computeHash = require('sha1')
var MemDOWN = require('memdown')
var stringify = require('canonical-json')
var parse = JSON.parse
var TreeStore = require('./treestore')
var utils = require('./utils')
var iterators = require('async-iterators')

var createLevelDB = function (location) { return new MemDOWN(location) }

var createIterator = function(db) {
  return db.iterator({keyAsBuffer: false, valueAsBuffer: false})
}

var createStage = function(name, head) {
  return createLevelDB(name + '_stage_' + head)
}

var stageStringify = function(resource) {
  if (resource.object) {
    if (resource.object._children) resource.object._children.sort()
  }
  return stringify(resource)
}

var Database = function(name) {
  this.name = name
  this.head = null
  this.refs = createLevelDB(name + '_refs')
  this.stage = createStage(name, this.head)
  var treeStoreBackend = createLevelDB(name + '_cas')
  this.treeStore = new TreeStore(treeStoreBackend, null)
}

var updateParent = function(parentPath, childKey, db, cb) {
  db.get(parentPath, function(err, parentRes) {
    parentRes = parentRes || {object: {}}
    parentRes.object._children = parentRes.object._children || []

    if (! _.contains(parentRes.object._children, childKey)) {
      parentRes.object._children.push(childKey)
      db.put(parentPath, parentRes, cb)
    } else {
      cb()
    }
  })
}

Database.prototype.put = function(path, resource, cb) {
  var self = this
  var parentPath = utils.getParentPath(path)
  var childKey = utils.getLastPathComponent(path)

  var putResource = function() {
    self.stage.put(path, stageStringify(resource), cb)
  }

  if (path == '/') return putResource()

  updateParent(parentPath, childKey, this, putResource)
}

var writeStageToTreeStore = function(stage, treeStore, cb) {
  var iterator = createIterator(stage)
  iterators.forEachAsync(iterator, function(err, path, value, cb) {
    treeStore.put(path, value, cb)
  }, cb)
}

var resetStage = function(db, cb) {
  var stageToCommit = db.stage
  var newStage = createStage(db.name, db.head)
  newStage.open(function() {
    db.stage = newStage
    cb(null, stageToCommit)
  })
}

var writeCommitObject = function(db, cb) {
  var commitObj = {data: db.treeStore.head, ancestors: []}
  if (db.head) commitObj.ancestors.push(db.head)

  var stringifiedCommit = stringify(commitObj)
  var hash = computeHash(stringifiedCommit)
  
  db.refs.put(hash, stringifiedCommit, function(err) {
    db.refs.put('branch/master', hash, function(err) {
      db.head = hash
      cb(err, {head: db.head})
    })
  })
}

Database.prototype.post = function(path, resource, cb) {
  var id = computeHash(this.head + path + stageStringify(resource))
  var putPath = path + '/' + id
  
  this.put(putPath, resource, function(err, res) {
    cb(err, {path: putPath})
  })
}

Database.prototype.get = function(path, cb) {
  var self = this
  this.stage.get(path, function(err, res) {
    if (err) {
      self.treeStore.get(path, cb)
    } else {
      cb(null, parse(res))
    }
  })
}

Database.prototype.getStagedResources = function(cb) {
  iterators.map(createIterator(this.stage), function(err, key, value) {
    return {path: key, resource: parse(value)}
  }, cb)
}

Database.prototype.commit = function(cb) {
  var self = this
  resetStage(this, function(err, stageToCommit) {
    writeStageToTreeStore(stageToCommit, self.treeStore, function() {
      writeCommitObject(self, cb)
    })
  })
}

Database.prototype.getAncestors = function(hash, cb) {
  this.refs.get(hash, function(err, res) {
    var commit = parse(res)
    cb(null, {ancestors: commit.ancestors})
  })
}

module.exports = {
  database: function(name) { return new Database(name) }
}
