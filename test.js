var tests = require('abstract-chunk-store/tests')
var tape = require('tape')
var idb = require('./')

tests(tape, idb)

tape('empty test case', function (t) {
  t.plan(2)
  var store = idb(5, { name: 'test-store-' + Math.random() })
  store.get(0, function (err, buf) {
    t.ifError(err)
    t.deepEqual(buf, Buffer(0))
  })
})
