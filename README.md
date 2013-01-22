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
- **be small**: only implement the functional parts of syncing - leave everything else to the application (transport, persistence)
- **sensitive defaults**: have defaults that *just work* but still support custom logic (e.g. for conflict resolution)

##Usage
###Sets
###Dictionaries
###Ordered Lists
###OrderedSets

##What about synclib?
[Synclib](https://github.com/mirkok/synclib) only supported syncing of tree-based data. Synclib2 is the result of a complete rewrite while providing more generic support for various basic data structures.

##Contributors
This project was created by Mirko Kiefer ([@mirkok](https://github.com/mirkok)).
