const tests = require('abstract-chunk-store/tests')
const tape = require('tape')
const IdbChunkStore = require('./')

tests(tape, IdbChunkStore)

tape('only store relevant slice of Uint8Array', (t) => {
  const store = new IdbChunkStore(10)

  const slicedArray = new Uint8Array(Buffer.from('0123456789012345').buffer, 1, 10)
  t.equal(slicedArray.buffer.byteLength, 16)
  t.equal(slicedArray.byteOffset, 1)
  t.equal(slicedArray.byteLength, 10)

  store.put(0, slicedArray, function (err) {
    t.error(err)
    store.get(0, function (err, chunk) {
      t.error(err)
      t.deepEqual(chunk, Buffer.from('1234567890'))

      t.equal(chunk.buffer.byteLength, 10)
      t.equal(chunk.byteOffset, 0)
      t.equal(chunk.byteLength, 10)

      store.destroy(function (err) {
        t.error(err)
        t.end()
      })
    })
  })
})
