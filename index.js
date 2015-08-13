module.exports = Storage

function Storage () {
  if (!(this instanceof Storage)) return new Storage()
  this.chunks = []
}

Storage.prototype.put = function (index, buf, cb) {
  this.chunks[index] = buf
  if (cb) process.nextTick(cb)
}

function nextTick (cb, err, val) {
  process.nextTick(function () {
    cb(err, val)
  })
}

Storage.prototype.get = function (index, opts, cb) {
  if (typeof opts === 'function') return this.get(index, null, opts)
  var buf = this.chunks[index]
  if (!buf) return nextTick(cb, new Error('Chunk not found'))
  if (!opts) return nextTick(cb, null, buf)
  var offset = opts.offset || 0
  var len = opts.length || (buf.length - offset)
  nextTick(cb, null, buf.slice(offset, len + offset))
}
