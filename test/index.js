

var store1 = new Store(Set)

var commit1 = store1.reset([1, 2, 3])

var commit2 = store1.write(commit1, {diff: {insert: [4, 5]}})

var commit3 = store1.write(commit1, {diff: {delete: [0]}})

// now we have two branches (branches are just commits with no descendants)
var branches = store1.branches()

// merge them
var mergedDiff = store1.merge(branches)

mergedDiff.resolveConflicts()

var commit4 = store1.write(branches, mergedDiff)

// reset just calculates the diff for you
var commit5 = store1.reset(commit4, [3, 4, 5])

// I would simplify this to only allow one branch per store - so you dont need to track commits when writing
// if you need multiple branches you just use multiple stores

// events:

store1.on('written', function(commit) {...})
store1.on('write', function(oldCommit, newCommit) {...})
// commits are just hash of the parent commit + diff hash

/* ok but how do the syncing??

ask server for diff between last sync (common ancestor) and his head
do a local 3-way merge
push diff to server and update head

ok what if we don't know our common ancestor with the server?
then we can exchange a full list of commits OR just transfer the full data

thats cool because it means all nodes can decide to forget history and syncing still works fine - just less efficient.

ok this doesnt work in a distributed way
we have to transfer all interim commits and their data as well!

ideal sync process is:
push all commits since last synced commit
ask server for common ancestor of local head and remote head
push all local data since common ancestor
if common ancestor = remote head
  try fast-forward remote head
  if failed (someone else updated head in the meantime) then start over
else
  ask for all remote commits + data since common ancestor
  do local merge
  start over
*/

var remote = new RemoteStore(Set, url)
remote.head(function(err, head) {
  remote.diff(lastSyncedCommit, remoteHead, function(err, remoteDiff) {
    var mergedDiff = merge([localDiff, remoteDiff])
    // resolve conflicts!
    store1.write([localHead, remoteHead], lastSyncedCommit, mergedDiff)
    remote.write([localHead, remoteHead], lastSyncedCommit, mergedDiff)
  })
})
var diff = remote.diff