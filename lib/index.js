
var _ = require('underscore')
var url = require('url')
var computeHash = require('sha1')
var MemDOWN = require('memdown')
var levelup = require('levelup')
var factory = function (location) { return new MemDOWN(location) }
var stringify = require('canonical-json')
var parse = JSON.parse
var findCommonAncestor = require('ancestor')
var TreeStore = require('./treestore')

var Database = function(name) {
  this.name = name
  this.head = null
  this.refs = levelup(name + '_refs', { db: factory })
  this.stage = levelup(name + '_stage', { db: factory })
  var treeStoreBackend = levelup(name + '_cas', { db: factory })
  this.treeStore = new TreeStore(treeStoreBackend, null)
}

Database.prototype.put = function(path, resource, cb) {
  this.treeStore.put(path, resource, cb)
}

Database.prototype.post = function(path, resource, cb) {
  var id = computeHash(this.head + path + stringify(resource))
  var putPath = path + '/' + id
  this.put(putPath, resource, function(err, res) {
    cb(err, {path: putPath})
  })
}

Database.prototype.get = function(path, cb) {
  this.treeStore.get(path, cb)
}

Database.prototype.commit = function(cb) {
  var that = this
  var commitObj = {data: this.treeStore.head, ancestors: []}
  if (this.head) commitObj.ancestors.push(this.head)
  var stringifiedCommit = stringify(commitObj)
  var hash = computeHash(stringifiedCommit)
  
  this.refs.put(hash, stringifiedCommit, function(err) {
    that.refs.put('branch/master', hash, function(err) {
      that.head = hash
      cb(err, {head: that.head})
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
