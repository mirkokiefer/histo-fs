
var _ = require('underscore')
var url = require('url')
var computeHash = require('sha1')
var MemDOWN = require('memdown')
var levelup = require('levelup')
var factory = function (location) { return new MemDOWN(location) }
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
      parentResource.dictionary['_' + directory] = {hash: hash}
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
      var child = resource.dictionary['_' + first]
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
  this.refs = levelup(name, { db: factory })
  this.contentAddressable = levelup(name, { db: factory })
}

Database.prototype.put = function(path, resource, cb) {
  var that = this
  var pathTokens = parsePathTokens(path)
  putResource(pathTokens, resource, that, function(err, res) {
    that.stageHead = res.stageHead
    that.refs.put('branch/stage', that.stageHead, function(err) {
      cb(null, {success: true})
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
  getResource(pathTokens, this.stageHead, this, cb)
}

Database.prototype.commit = function(cb) {
  var that = this
  this.refs.put('branch/master', this.stageHead, function(err) {
    that.head = that.stageHead
    cb(err, {head: that.head})
  })
}

module.exports = {
  database: function(name) { return new Database(name) }
}
