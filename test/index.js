
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
    name: 'Jim',
  }
}

var ann = {
  dictionary: {
    name: 'Ann',
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
    assignee: '/ann',
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
        "path":"/members/ddd0a27f2f483ef3117adb93b0153f5beb3e148c"
      })
      done()
    })
  })
  it('should post ann as child resource', function(done) {
    db.post('/members', ann, function(err, res) {
      assert.deepEqual(res, {
        "path":"/members/9c37ba065ec42fe4f900b7452b81888ffc04615a"
      })
      done()
    })
  })
  it('should retrieve the updated root resource', function(done) {
    var expected = {"dictionary":{
      "name":"LivelyCode",
      "_members": {hash: "c6a109890f39f7a1cb91b5a00d571341a96ea205"}
    }}
    db.get('/', function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should retrieve the list of members', function(done) {
    var expected = { dictionary: {
      '_9c37ba065ec42fe4f900b7452b81888ffc04615a': {hash: '5998e29c9003e1d2d2be515d0bdb571d191e4210'},
      '_ddd0a27f2f483ef3117adb93b0153f5beb3e148c': {hash: '86cd722c67a3ea77c5471a516bbd6e0dc410c5c3'}
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

describe('committing', function() {
  it('should commit the current state', function(done) {
    db.commit(function(err, res) {
      assert.equal(res.head, 'ff5ded15ee4435e6ebc91e92cb719a318de3ff16')
      done()
    })
  })
  it('should change some existing data and verify its stored', function(done) {
    var jim1 = {
      dictionary: {
        name: 'Jimmy',
      }
    }
    db.put('/members/ddd0a27f2f483ef3117adb93b0153f5beb3e148c', jim1, function() {
      db.get('/members/ddd0a27f2f483ef3117adb93b0153f5beb3e148c', function(err, res) {
        assert.deepEqual(res, jim1)
        done()
      })
    })
  })
  it('should commit the changes', function(done) {
    db.commit(function(err, res) {
      assert.equal(res.head, '9b36233a5748386d49dc7041905c7be3617b051d')
      done()
    })
  })
  it('should retrieve the last commit', function(done) {
    var expected = {
      data: '7961905b593da124c9b541f5d65b288d91da8c7f',
      ancestors: [
        'ff5ded15ee4435e6ebc91e92cb719a318de3ff16'
      ]
    }
    db.getCommit('9b36233a5748386d49dc7041905c7be3617b051d', function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
  it('should retrieve the ancestor commit', function(done) {
    var expected = {
      data: '12d918f7f4bf11cbaa53f228bd8c96baeff0d0dc',
      ancestors: []
    }
    db.getCommit('ff5ded15ee4435e6ebc91e92cb719a318de3ff16', function(err, res) {
      assert.deepEqual(res, expected)
      done()
    })
  })
})
