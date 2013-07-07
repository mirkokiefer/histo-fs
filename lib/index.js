
var _ = require('underscore')
var computeHash = require('sha1')
var MemDOWN = require('memdown')
var stringify = require('canonical-json')
var parse = JSON.parse
var TreeStore = require('./treestore')
var utils = require('./utils')
var async = require('async')
var iterators = require('async-iterators')

var createLevelDB = function (location) { return new MemDOWN(location) }

var createIterator = function(db) {
  return db.iterator({keyAsBuffer: false, valueAsBuffer: false})
}

var stageStringify = function(resource) {
  if (resource.dictionary) {
    if (resource.dictionary._children) resource.dictionary._children.sort()
  }
  return stringify(resource)
}

var Database = function(name) {
  this.name = name
  this.head = null
  this.refs = createLevelDB(name + '_refs')
  this.stage = createLevelDB(name + '_stage')
  var treeStoreBackend = createLevelDB(name + '_cas')
  this.treeStore = new TreeStore(treeStoreBackend, null)
}

var updateParent = function(parentPath, childKey, db, cb) {
  db.get(parentPath, function(err, parentRes) {
    parentRes = parentRes || {dictionary: {}}
    parentRes.dictionary._children = parentRes.dictionary._children || []

    if (! _.contains(parentRes.dictionary._children, childKey)) {
      parentRes.dictionary._children.push(childKey)
      db.put(parentPath, parentRes, cb)
    } else {
      cb()
    }
  })
}

Database.prototype.put = function(path, resource, cb) {
  var that = this
  var parentPath = utils.getParentPath(path)
  var childKey = utils.getLastPathComponent(path)

  var putResource = function() {
    that.stage.put(path, stageStringify(resource), cb)
  }

  if (path == '/') return putResource()

  updateParent(parentPath, childKey, this, putResource)
}

var writeStageToTreeStore = function(db, cb) {
  var iterator = createIterator(db.stage)
  iterators.forEachAsync(iterator, function(err, path, value, cb) {
    db.treeStore.put(path, value, cb)
  }, cb)
}

Database.prototype.post = function(path, resource, cb) {
  var id = computeHash(this.head + path + stageStringify(resource))
  var putPath = path + '/' + id
  this.put(putPath, resource, function(err, res) {
    cb(err, {path: putPath})
  })
}

Database.prototype.get = function(path, cb) {
  var that = this
  this.stage.get(path, function(err, res) {
    if (err) {
      that.treeStore.get(path, cb)
    } else {
      cb(null, parse(res))
    }
  })
}

Database.prototype.commit = function(cb) {
  var that = this
  writeStageToTreeStore(this, function() {
    var commitObj = {data: that.treeStore.head, ancestors: []}
    if (that.head) commitObj.ancestors.push(that.head)
    var stringifiedCommit = stringify(commitObj)
    var hash = computeHash(stringifiedCommit)
    
    that.refs.put(hash, stringifiedCommit, function(err) {
      that.refs.put('branch/master', hash, function(err) {
        that.head = hash
        cb(err, {head: that.head})
      })
    })
  })
}

Database.prototype.getCommit = function(hash, cb) {
  this.refs.get(hash, function(err, res) {
    cb(null, parse(res))
  })
}

module.exports = {
  database: function(name) { return new Database(name) }
}
