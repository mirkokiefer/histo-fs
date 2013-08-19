#HistoDB
Peer-to-peer synchronizable database for the browser and Node.js.

##Design goals
- **no timestamps**: history based 3-way merging
- **distributed**: merging does not require a central server
- **no change tracing**: change tracing is not necessary - support diff computation on the fly
- **data agnostic**: leave diff and merge of the actual data to plugins
- **be small**: only implement the functional parts of syncing - leave everything else to the application (transport, persistence)
- **sensitive defaults**: have defaults that *just work* but still support custom logic (e.g. for conflict resolution)

##Implementation
As syncing is history based we need to track the entire history of a database.  
Every client has his own replica of the database and commits data locally.  
On every commit we create a commit object that links both to the new version of the data and the previous commit.  
If a client is connected to a server he will start the sync process on every commit. As synclib2's architecture is distributed a server could itself be a client who is connected to other servers.  
To the latest commit on a database we refer to as the 'head'.

Syncing follows the following protocol:

```
sourceHead = source.head.master
targetHead = target.head.master
lastSyncedCommit = target.getRemoteTrackingHead(source.id)

commitIDsSource = source.getCommitDifference(lastSyncedCommit, sourceHead)

target.writeCommitIDs(commitIDsSource)

commonAncestor = target.getCommonAncestor(targetHead, sourceHead)

changedData = source.getDataDifference(commonAncestor, sourceHead)

target.writeData(changedData)

target.setRemoteTrackingHead(source.id, sourceHead)
```

This protocol is able to minimize the amount of data sent between synced stores even in a distributed, peer-to-peer setting.

Updating the server's head uses optimistic locking. To update the head you need to include the last read head in your request.

For diff, merge and patch computation the library makes heavy use of [diff-merge-patch](https://github.com/mirkok/diff-merge-patch).

##Usage
###Sets
###Dictionaries
###Ordered Lists
###OrderedSets

##Contributors
This project was created by Mirko Kiefer ([@mirkokiefer](https://github.com/mirkokiefer)).
