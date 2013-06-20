

var Server = function(address) {
  this.address = address
  this.lastSyncedCommit = null
}

Server.prototype.sync = function(localHead, readAncestors) {
  var commitsToSync = commits.slice()
}
