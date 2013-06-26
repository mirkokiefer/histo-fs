
var assert = require('assert')
var utils = require('../lib/utils')

var toHex = function(bytes) {
  return bytes.toString('hex')
}

var tests = [
  ['/',       'a042000000000000000070300000'],
  ['/a',      'a0423ff00000000000007030620000'],
  ['/a/b',    'a042400000000000000070306230630000'],
  ['/a/b/c',  'a0424008000000000000703062306330640000']
]

describe('utils', function() {

  describe('serializePath: it should serialize a path to be lexicographically sortable by depth', function() {
    tests.forEach(function(each, i) {
      it('should serialize and deserialize test ' + i, function() {
        var serialized = utils.serializePath(each[0])
        assert.equal(toHex(serialized), each[1])
        var deserialized = utils.deserializePath(serialized)
        assert.deepEqual(deserialized, each[0])
      })
    })
  })
  
})