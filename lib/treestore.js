
var _ = require('underscore')
var stringify = require('canonical-json')
var parse = JSON.parse
var types = require('./types')
var computeHash = require('sha1')
var utils = require('./utils')
var parsePathTokens = utils.parsePathTokens

var putResource = function(pathTokens, resource, db, cb) {
  var stringified = stringify(resource)
  var hash = computeHash(stringified)
  db.contentAddressable.put(hash, stringified, function() {
    var directory = pathTokens.pop()
    if (directory) {
      getResource(pathTokens, db.head, db, function(err, parentResource) {
        if (err) parentResource = {dictionary: {}}
        parentResource.dictionary[directory] = {hash: hash}
        putResource(pathTokens, parentResource, db, function(err, res) {
          cb(null, {hash: hash, head: res.head})
        })
      })
    } else {
      cb(null, {head: hash})
    }
  })
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

var TreeStore = function(store, head) {
  this.contentAddressable = store
  this.head = head
}

TreeStore.prototype.put = function(path, resource, cb) {
  var that = this
  var pathTokens = parsePathTokens(path)
  getResource(pathTokens, this.head, this, function(err, oldRes) {
    var serialized = types.dictionary.serialize(resource, oldRes)
    putResource(pathTokens, serialized, that, function(err, res) {
      that.head = res.head
      cb(null, {success: true})
    })
  })
}

TreeStore.prototype.get = function(path, cb) {
  var pathTokens = parsePathTokens(path)
  getResource(pathTokens, this.head, this, function(err, res) {
    if (err) return cb(err, res)
    var deserialized = types.dictionary.deserialize(res)
    cb(null, deserialized)
  })
}

module.exports = TreeStore
