#synclib2
Realtime and non-realtime syncing of common data structures:

- Sets
- Dictionaries
- Ordered Lists
- Ordered Sets

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
Client has committed to its local database.
Client pushs all commits since the last synced commit to Server.
Client asks Server for the common ancestor of client's head and the server's head
Client pushs all changed data since the common ancestor to Server.

if common ancestor == server head
  // there is no data to merge
  try fast-forward of server's head to client's head
  if failed (someone else updated server's head in the meantime) then start over
else
  Client asks Server for all commits + data since the common ancestor
  Client does a local merge and commits it to the local database
  start over
```

This protocol is able to minimize the amount of data sent between synced stores even in a distributed, peer-to-peer setting.

Updating the server's head uses optimistic locking. To update the head you need to include the last read head in your request.

For diff, merge and patch computation the library makes heavy use of [diff-merge-patch](https://github.com/mirkok/diff-merge-patch).

##Usage
###Sets
###Dictionaries
###Ordered Lists
###OrderedSets

##What about synclib?
[Synclib](https://github.com/mirkok/synclib) only supported syncing of tree-based data. Synclib2 is the result of a complete rewrite while providing more generic support for various basic data structures.

##Contributors
This project was created by Mirko Kiefer ([@mirkokiefer](https://github.com/mirkokiefer)).
