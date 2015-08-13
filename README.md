# memory-chunk-store

In memory chunk store that is [abstract-chunk-store](https://github.com/mafintosh/abstract-chunk-store) compliant

```
npm install memory-chunk-store
```

## Usage

``` js
var mem = require('memory-chunk-store')
var chunks = mem()

chunks.put(0, new Buffer('first chunk'), function (err) {
  if (err) throw err
  chunks.get(0, function (err, chunk) {
    if (err) throw err
    console.log(chunk) // 'first chunk' as a buffer
  })
})
```

## License

MIT
