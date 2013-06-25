
var _ = require('underscore')
var url = require('url')
var computeHash = require('sha1')
var MemDOWN = require('memdown')
var levelup = require('levelup')
var factory = function (location) { return new MemDOWN(location) }

var types = require('./types')

var stringify = require('canonical-json')
var parse = JSON.parse

var parsePathTokens = function(path) {
  var tokens = path.split('/')
  if ((tokens.length == 2) && (tokens[1] == '')) tokens.pop()
  tokens.shift()
  return tokens
}

var putResource = function(pathTokens, resource, db, cb) {
  var stringified = stringify(resource)
  var hash = computeHash(stringified)
  db.contentAddressable.put(hash, stringified)

  var directory = pathTokens.pop()
  if (directory) {
    getResource(pathTokens, db.stageHead, db, function(err, parentResource) {
      if (err) parentResource = {dictionary: {}}
      parentResource.dictionary[directory] = {hash: hash}
      putResource(pathTokens, parentResource, db, function(err, res) {
        cb(null, {hash: hash, stageHead: res.stageHead})
      })
    })
  } else {
    cb(null, {stageHead: hash})
  }
}

var getResource = function(pathTokens, root, db, cb) {
  db.contentAddressable.get(root, function(err, serializedData) {
    if (err) return cb(err)
    var first = _.first(pathTokens)
    var rest = _.rest(pathTokens)
    var resource = parse(serializedData)
    if (first) {
      var child = resource.dictionary[first]
      if (!child) return cb(new Error('child not found'))
      getResource(rest, child.hash, db, cb)
    } else {
      cb(null, resource)
    }
  })
}

var Database = function(name) {
  this.name = name
  this.head = null
  this.stageHead = null
  this.tags = levelup(name, { db: factory })
  this.contentAddressable = levelup(name, { db: factory })
}

Database.prototype.put = function(path, resource, cb) {
  var that = this
  var pathTokens = parsePathTokens(path)
  getResource(pathTokens, this.head, this, function(err, oldRes) {
    var serialized = types.dictionary.serialize(resource, oldRes)
    putResource(pathTokens, serialized, that, function(err, res) {
      that.stageHead = res.stageHead
      that.tags.put('branch/stage', that.stageHead, function(err) {
        cb(null, {success: true})
      })
    })
  })
}

Database.prototype.post = function(path, resource, cb) {
  var id = computeHash(this.head + path + stringify(resource))
  var putPath = path + '/' + id
  this.put(putPath, resource, function(err, res) {
    cb(err, {path: putPath})
  })
}

Database.prototype.get = function(path, cb) {
  var pathTokens = parsePathTokens(path)
  getResource(pathTokens, this.stageHead, this, function(err, res) {
    if (err) return cb(err, res)
    var deserialized = types.dictionary.deserialize(res)
    cb(null, deserialized)
  })
}

Database.prototype.commit = function(cb) {
  var that = this
  this.tags.put('branch/master', this.stageHead, function(err) {
    that.head = that.stageHead
    cb(err, {head: that.head})
  })
}

module.exports = {
  database: function(name) { return new Database(name) }
}
