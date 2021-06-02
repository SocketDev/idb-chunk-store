# idb-chunk-store [![Build Status](https://img.shields.io/github/workflow/status/MinEduTDF/idb-chunk-store/ci/master)](https://github.com/MinEduTDF/idb-chunk-store/actions) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

#### IndexedDB chunk store that is [abstract-chunk-store](https://github.com/mafintosh/abstract-chunk-store) compliant

For versions before 1.0, see https://github.com/MinEduTDF/idb-chunk-store

## Install

```
npm install idb-chunk-store
```

## Usage

``` js
var idbChunkStore = require('idb-chunk-store')
var chunks = idbChunkStore(10)

chunks.put(0, new Buffer('01234567890'), function (err) {
  if (err) throw err
  chunks.get(0, function (err, chunk) {
    if (err) throw err
    console.log(chunk) // '01234567890' as a buffer
  })
})
```

## API

### var store = idbChunkStore(chunkLength, opts={})

Create a new chunk store with chunks of size `chunkLength`.

* `opts.name` - use a name to separate the contents of different stores

## License

MIT
