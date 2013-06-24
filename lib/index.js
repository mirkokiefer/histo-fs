
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
  var serialized = stringify(resource)
  var hash = computeHash(serialized)
  db.backend.put(hash, serialized)

  var directory = pathTokens.pop()
  if (directory) {
    getResource(pathTokens, db.head, db, function(err, parentResource) {
      if (err) parentResource = {dictionary: {}}
      parentResource.dictionary[directory] = hash
      putResource(pathTokens, parentResource, db, function(err, res) {
        cb(null, {hash: hash, head: res.head})
      })
    })
  } else {
    cb(null, {head: hash})
  }
}

var getResource = function(pathTokens, root, db, cb) {
  db.backend.get(root, function(err, serializedData) {
    if (err) return cb(err)
    var first = _.first(pathTokens)
    var rest = _.rest(pathTokens)
    var resource = parse(serializedData)
    if (first) {
      getResource(rest, resource.dictionary[first], db, cb)
    } else {
      cb(null, resource)
    }
  })
}

var Database = function(name) {
  this.name = name
  this.backend = levelup(name, { db: factory })
}

Database.prototype.put = function(path, resource, cb) {
  var that = this
  var pathTokens = parsePathTokens(path)
  putResource(pathTokens, resource, this, function(err, res) {
    that.head = res.head
    cb(null, {hash: res.hash})
  })
}

Database.prototype.post = function(path, resource, cb) {
  var id = computeHash(this.head + path + stringify(resource))
  var putPath = path + '/' + id
  this.put(putPath, resource, function(err, res) {
    cb(err, {path: putPath, hash: res.hash})
  })
}

Database.prototype.get = function(path, cb) {
  var pathTokens = parsePathTokens(path)
  getResource(pathTokens, this.head, this, cb)
}

module.exports = {
  database: function(name) { return new Database(name) }
}
