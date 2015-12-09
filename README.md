# idb-chunk-store 
#### IndexedDB chunk store that is [abstract-chunk-store](https://github.com/mafintosh/abstract-chunk-store) compliant

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

## License

MIT
