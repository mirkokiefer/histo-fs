
var assert = require('assert')
var utils = require('../lib/utils')

describe('utils', function() {

  describe('parsePathTokens: should split a path into tokens', function() {
    var tests = [
      ['/',       []],
      ['/a',      ['a']],
      ['/a/b',    ['a', 'b']],
      ['/a/b/c',  ['a', 'b', 'c']]
    ]
    tests.forEach(function(each, i) {
      it('should run test ' + i, function() {
        var res = utils.parsePathTokens(each[0])
        assert.deepEqual(res, each[1])
      })
    })
  })

  describe('serializePath: should serialize a path to be lexicographically sortable by depth', function() {
    var toHex = function(bytes) {
      return bytes.toString('hex')
    }

    var tests = [
      ['/',       'a042000000000000000070300000'],
      ['/a',      'a0423ff00000000000007030620000'],
      ['/a/b',    'a042400000000000000070306230630000'],
      ['/a/b/c',  'a0424008000000000000703062306330640000']
    ]

    tests.forEach(function(each, i) {
      it('should run test ' + i, function() {
        var serialized = utils.serializePath(each[0])
        assert.equal(toHex(serialized), each[1])
        var deserialized = utils.deserializePath(serialized)
        assert.deepEqual(deserialized, each[0])
      })
    })
  })
  
})