
var _ = require('underscore')
var computeHash = require('sha1')
//var levelBackend = require('memdown')
var levelBackend = require('leveldown')
var stringify = require('canonical-json')
var parse = JSON.parse
var TreeStore = require('./treestore')
var utils = require('./utils')
var iterators = require('async-iterators')
var types = require('./types')
var async = require('async')
var graphDiff = require('graph-difference')

var createLevelDB = function (location) {
  var backend = levelBackend(location)
  backend._destroy = function(cb) {
    levelBackend.destroy(location, cb)      
  }
  return backend
}

var createStageIterator = function(db) {
  var stageIterator = db.iterator({valueAsBuffer: false, reverse: true})
  var next = function(cb) {
    stageIterator.next(function(err, path, resource) {
      if (path === undefined) return cb(err)
      cb(err, utils.deserializePath(path), resource)
    })
  }
  return {next: next}
}

var createStage = function(name, head) {
  return createLevelDB(name + '_stage_' + head)
}

var destroyStage = function(stage, cb) {
  stage.close(function() {
    stage._destroy(cb)
  })
}

var stagePut = function(stage, path, resource, cb) {
  stage.put(utils.serializePath(path), stageStringify(resource), cb)
}

var stageGet = function(stage, path, cb) {
  stage.get(utils.serializePath(path), {asBuffer: false}, cb)
}

var refsGet = function(refs, hash, cb) {
  refs.get(hash, function(err, res) {
    cb(err, parse(res))
  })
}

var stageStringify = function(resource) {
  if (resource.object) {
    if (resource.object._children) resource.object._children.sort()
  }
  return stringify(resource)
}

var Database = function(dir, name) {
  this.name = dir + '/' + name
  this.head = null
  this.treeHead = null
  this.refs = createLevelDB(this.name + '_refs')
  this.stage = createStage(this.name, 'init')
  var treeStoreBackend = createLevelDB(this.name + '_cas')
  this.treeStore = new TreeStore(treeStoreBackend)
}

Database.prototype.backingStores = function() {
  return [this.refs, this.stage, this.treeStore.contentAddressable]
}

Database.prototype.open = function(cb) {
  async.each(this.backingStores(), function(each, cb) { each.open(cb) }, cb)    
}

Database.prototype.close = function(cb) {
  async.each(this.backingStores(), function(each, cb) { each.close(cb) }, cb)    
}

Database.prototype.destroy = function(cb) {
  async.each(this.backingStores(), function(each, cb) { each._destroy(cb) }, cb)    
}

var resetStage = function(db, cb) {
  var newStage = createStage(db.name, db.head)
  newStage.open(function() {
    var oldStage = db.stage
    db.stage = newStage
    oldStage.close(function() {
      oldStage._destroy(cb)
    })
  })
}

Database.prototype.resetHead = function(commitHash, cb) {
  var self = this
  refsGet(this.refs, commitHash, function(err, commit) {
    self.refs.put('branch/master', commitHash, function(err) {
      resetStage(self, function() {
        self.head = commitHash
        self.treeHead = commit.data
        cb(null, {head: self.head})
      })
    })
  })
}

var updateParent = function(parentPath, childKey, db, cb) {
  db.get(parentPath, function(err, parentRes, isCached) {
    parentRes = parentRes || {object: {}}
    parentRes.object._children = parentRes.object._children || []

    if (!_.contains(parentRes.object._children, childKey)) {
      parentRes.object._children.push(childKey) 
    } else if (isCached) {
      return cb()
    }
    db.put(parentPath, parentRes, cb)
  })
}

Database.prototype.put = function(path, resource, cb) {
  var self = this
  var parentPath = utils.getParentPath(path)
  var childKey = utils.getLastPathComponent(path)
  var putResource = function() {
    stagePut(self.stage, path, resource, cb)
  }

  if (path == '/') return putResource()

  updateParent(parentPath, childKey, this, putResource)
}

var writeStageToTreeStore = function(stage, treeStore, db, cb) {
  var hashCache = {}
  var rootHash = null
  var writeValue = function(path, value, cb) {
    treeStore.put(value, function(err, res) {
      if (path == '/') {
        rootHash = res.hash
        return cb()
      }
      var parentPath = utils.getParentPath(path)
      var childName = utils.getLastPathComponent(path)
      if (!hashCache[parentPath]) hashCache[parentPath] = {}
      hashCache[parentPath][childName] = {hash: res.hash}
      cb()
    })
  }
  var iterator = createStageIterator(stage)
  iterators.forEachAsync(iterator, function(err, path, value, cb) {
    value = parse(value)
    if (value.object) {
      treeStore.getPath(path, db.treeHead, function(err, oldRes) {
        var hashs = _.extend(hashCache[path] || {}, oldRes || {})
        var serialized = types.object.serialize(value, hashs)
        writeValue(path, serialized, cb)
      })
    } else {
      writeValue(path, value, cb)
    }
  }, function() {
    cb(null, rootHash)
  })
}

var writeCommitObject = function(rootHash, db, cb) {
  var commitObj = {data: rootHash, ancestors: []}
  if (db.head) commitObj.ancestors.push(db.head)

  var stringifiedCommit = stringify(commitObj)
  var hash = computeHash(stringifiedCommit)
  
  db.refs.put(hash, stringifiedCommit, function(err) {
    cb(null, {hash: hash})
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
  stageGet(this.stage, path, function(err, res) {
    if (err) {
      self.treeStore.getPath(path, self.treeHead, function(err, res) {
        if (err) return cb(err)
        var deserialized = res.object ? types.object.deserialize(res) : res
        self.put(path, deserialized, function() {
          cb(err, deserialized)          
        })
      })
    } else {
      cb(null, parse(res))
    }
  })
}

Database.prototype.getUpdatedResources = function(cb) {
  iterators.map(createStageIterator(this.stage), function(err, key, value) {
    return {path: key, resource: parse(value)}
  }, cb)
}

Database.prototype.commitUpdates = function(cb) {
  var self = this
  writeStageToTreeStore(this.stage, self.treeStore, self, function(err, rootHash) {
    writeCommitObject(rootHash, self, function(err, res) {
      self.resetHead(res.hash, cb)
    })
  })
}

Database.prototype.getCommitAncestors = function(hash, cb) {
  refsGet(this.refs, hash, function(err, commit) {
    cb(null, {ancestors: commit.ancestors})
  })
}

Database.prototype.getCommitDifference = function(ref1, ref2, cb) {
  var self = this
  var readAncestors = function(hash, cb) {
    refsGet(self.refs, hash, function(err, commit) {
      cb(null, commit.ancestors)
    })
  }
  graphDiff(ref1, ref2, readAncestors, cb)
}

module.exports = {
  database: function(dir, name) { return new Database(dir, name) }
}
