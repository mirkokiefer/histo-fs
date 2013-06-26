
var types = require('../lib/types')
var stringify = require('canonical-json')
var assert = require('assert')

var deserialized = {dictionary: {
  name: 'My Company',
  _children: ['members', 'projects']
}}

var ancestor = {dictionary: {
  name: {atom: 'Test'},
  projects: {hash: 'a'},
}}

var serialized = {dictionary: {
  name: {atom: 'My Company'},
  projects: {hash: 'a'},
  members: {hash: null}
}}

var jim = {dictionary: {
  name: 'Jim'
}}

var jimSerialized = {dictionary: {
  name: {atom: 'Jim'}
}}

describe('serialization', function() {
  it('should serialize a dictionary resource', function() {
    var res = types.dictionary.serialize(deserialized, ancestor)
    assert.deepEqual(res, serialized)
  })
  it('should deserialize a dictionary resource', function() {
    var res = types.dictionary.deserialize(serialized)
    assert.deepEqual(res, deserialized)
  })
  it('should still serialize when no ancestor exisits', function() {
    var res = types.dictionary.serialize(deserialized, undefined)
    var expected = {dictionary: {
      name: {atom: 'My Company'},
      projects: {hash: null},
      members: {hash: null}
    }}
    assert.deepEqual(res, expected)
  })
  it('should omit the _children array if its empty', function() {
    var res = types.dictionary.serialize(jim, undefined)
    assert.deepEqual(res, jimSerialized)
  })
})
