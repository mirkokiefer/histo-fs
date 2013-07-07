
var types = require('../lib/types')
var stringify = require('canonical-json')
var assert = require('assert')

var deserialized = {object: {
  name: 'My Company',
  _children: ['members', 'projects']
}}

var ancestor = {object: {
  name: {atom: 'Test'},
  projects: {hash: 'a'},
}}

var serialized = {object: {
  name: {atom: 'My Company'},
  projects: {hash: 'a'},
  members: {hash: null}
}}

var jim = {object: {
  name: 'Jim'
}}

var jimSerialized = {object: {
  name: {atom: 'Jim'}
}}

describe('serialization', function() {
  it('should serialize a object resource', function() {
    var res = types.object.serialize(deserialized, ancestor)
    assert.deepEqual(res, serialized)
  })
  it('should deserialize a object resource', function() {
    var res = types.object.deserialize(serialized)
    assert.deepEqual(res, deserialized)
  })
  it('should still serialize when no ancestor exisits', function() {
    var res = types.object.serialize(deserialized, undefined)
    var expected = {object: {
      name: {atom: 'My Company'},
      projects: {hash: null},
      members: {hash: null}
    }}
    assert.deepEqual(res, expected)
  })
  it('should omit the _children array if its empty', function() {
    var res = types.object.serialize(jim, undefined)
    assert.deepEqual(res, jimSerialized)
  })
})
