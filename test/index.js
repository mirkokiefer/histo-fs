
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

var project = {
  dictionary: {
    name: 'Histo'
  }
}

var createExamples = {
  dictionary: {
    title: 'Create examples',
    assignee: '/jim',
    due_date: '2013-07-01'
  }
}

var writeTests = {
  dictionary: {
    title: 'Write tests',
    assignee: '/ann'
    due_date: '2013-07-03'
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
        "path":"/members/ddd0a27f2f483ef3117adb93b0153f5beb3e148c",
        "hash":"86cd722c67a3ea77c5471a516bbd6e0dc410c5c3"
      })
      done()
    })
  })
  it('should post ann as child resource', function(done) {
    db.post('/members', ann, function(err, res) {
      assert.deepEqual(res, {
        "path":"/members/9c37ba065ec42fe4f900b7452b81888ffc04615a",
        "hash":"5998e29c9003e1d2d2be515d0bdb571d191e4210"
      })
      done()
    })
  })
  it('should retrieve the updated root resource', function(done) {
    var expected = {"dictionary":{
      "members":"02482fd84dd3ef7d23915bcf34e8bba3d271782e",
      "name":"LivelyCode"
    }}
    db.get('/', function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should retrieve the list of members', function(done) {
    var expected = { dictionary: {
      '9c37ba065ec42fe4f900b7452b81888ffc04615a': '5998e29c9003e1d2d2be515d0bdb571d191e4210',
      'ddd0a27f2f483ef3117adb93b0153f5beb3e148c': '86cd722c67a3ea77c5471a516bbd6e0dc410c5c3'
    } }
    db.get('/members', function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should retrieve jim', function(done) {
    db.get('/members/ddd0a27f2f483ef3117adb93b0153f5beb3e148c', function(err, res) {
      assert.deepEqual(res, jim)
      done()
    })
  })
  it('should retrieve ann', function(done) {
    db.get('/members/9c37ba065ec42fe4f900b7452b81888ffc04615a', function(err, res) {
      assert.deepEqual(res, ann)
      done()
    })
  })
})