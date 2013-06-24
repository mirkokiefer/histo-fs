
var assert = require('assert')
var histo = require('../lib/index')

var db = histo.database('test')

var organization = {
  dictionary: {
    name: 'LivelyCode'
  }
}

var jim = {
  dictionary: {
    name: 'Jim'
  }
}

var ann = {
  dictionary: {
    name: 'Ann'
  }
}

describe('read/write to database', function() {
  it('should write a resource to a specific location', function(done) {
    db.put('/', organization, done)
  })
  it('should read the resource', function(done) {
    db.get('/', function(err, res) {
      assert.deepEqual(res, organization)
      done()
    })
  })
  it('should post jim as child resource', function(done) {
    db.post('/members', jim, function(err, res) {
      assert.deepEqual(res, {
        path: '/members/86e493a252bcbbf0364967152722d3f9aeac0fb9',
        hash: '86cd722c67a3ea77c5471a516bbd6e0dc410c5c3'
      })
      done()
    })
  })
  it('should post ann as child resource', function(done) {
    db.post('/members', ann, function(err, res) {
      assert.deepEqual(res, {
        path: '/members/49a6707e81de4284c5baea0b3ac2cf890ef74ec2',
        hash: '5998e29c9003e1d2d2be515d0bdb571d191e4210'
      })
      done()
    })
  })
  it('should retrieve the updated root resource', function(done) {
    var expected = {"dictionary":{
      "members":"d05e54c8f39d2d8a9a1ddacac1c66d0514f7022e",
      "name":"LivelyCode"
    }}
    db.get('/', function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should retrieve the list of members', function(done) {
    var expected = {dictionary: {
      '49a6707e81de4284c5baea0b3ac2cf890ef74ec2': '5998e29c9003e1d2d2be515d0bdb571d191e4210',
      '86e493a252bcbbf0364967152722d3f9aeac0fb9': '86cd722c67a3ea77c5471a516bbd6e0dc410c5c3'
    } }
    db.get('/members', function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should retrieve jim', function(done) {
    db.get('/members/86e493a252bcbbf0364967152722d3f9aeac0fb9', function(err, res) {
      assert.deepEqual(res, jim)
      done()
    })
  })
  it('should retrieve ann', function(done) {
    db.get('/members/49a6707e81de4284c5baea0b3ac2cf890ef74ec2', function(err, res) {
      assert.deepEqual(res, ann)
      done()
    })
  })
})