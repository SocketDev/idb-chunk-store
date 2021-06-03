# idb-chunk-store [![ci][ci-image]][ci-url] [![npm][npm-image]][npm-url] [![downloads][downloads-image]][downloads-url] [![javascript style guide][standard-image]][standard-url]

[ci-image]: https://img.shields.io/github/workflow/status/SocketDev/idb-chunk-store/ci/master
[ci-url]: https://github.com/SocketDev/idb-chunk-store/actions
[npm-image]: https://img.shields.io/npm/v/idb-chunk-store.svg
[npm-url]: https://npmjs.org/package/idb-chunk-store
[downloads-image]: https://img.shields.io/npm/dm/idb-chunk-store.svg
[downloads-url]: https://npmjs.org/package/idb-chunk-store
[standard-image]: https://img.shields.io/badge/code_style-standard-brightgreen.svg
[standard-url]: https://standardjs.com

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
