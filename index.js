var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')

module.exports = Storage

inherits(Storage, EventEmitter)
// vr idb = require('fake-indexeddb')
/* global self */
var env = typeof window === 'object' ? window : self
var idb = env.indexedDB || env.mozIndexedDB || env.webkitIndexedDB || env.msIndexedDB

function Storage (chunkLength, opts) {
  if (!(this instanceof Storage)) return new Storage(chunkLength, opts)
  if (!opts) opts = {}
  EventEmitter.call(this)
  this.setMaxListeners(100)

  var self = this
  this.chunkLength = Number(chunkLength)
  if (!this.chunkLength) throw new Error('First argument must be a chunk length')

  this.closed = false
  this.length = Number(opts.length) || Infinity

  if (this.length !== Infinity) {
    this.lastChunkLength = (this.length % this.chunkLength) || this.chunkLength
    this.lastChunkIndex = Math.ceil(this.length / this.chunkLength) - 1
  }

  self._ready = false

  var request = idb.open(opts.name || 'chunksDB')
  request.addEventListener('upgradeneeded', function () {
    var db = request.result
    db.createObjectStore('chunks')
  })
  request.addEventListener('success', function () {
    self.db = request.result
    self.emit('ready')
  })
}

Storage.prototype._store = function (mode, cb) {
  var self = this
  if (!self.db) return self.once('ready', ready)
  else process.nextTick(ready)

  function ready () {
    var trans = self.db.transaction(['chunks'], mode)
    var store = trans.objectStore('chunks')
    trans.addEventListener('error', function (err) { cb(err) })
    cb(null, store)
  }
}
Storage.prototype.put = function (index, buf, cb) {
  if (this.closed) return nextTick(cb, new Error('Storage is closed'))

  var isLastChunk = (index === this.lastChunkIndex)
  if (isLastChunk && buf.length !== this.lastChunkLength) {
    return nextTick(cb, new Error('Last chunk length must be ' + this.lastChunkLength))
  }
  if (!isLastChunk && buf.length !== this.chunkLength) {
    return nextTick(cb, new Error('Chunk length must be ' + this.chunkLength))
  }
  this._store('readwrite', function (err, store) {
    if (err) return cb(err)
    backify(store.put(JSON.stringify(buf), index), wait(store, cb))
  })
}

function wait (store, cb) {
  var pending = 2
  store.transaction.addEventListener('complete', done)
  return function (err) {
    if (err) cb(err)
    else done()
  }
  function done () { if (cb && --pending === 0) cb(null) }
}

Storage.prototype.get = function (index, opts, cb) {
  if (typeof opts === 'function') return this.get(index, null, opts)
  if (this.closed) return nextTick(cb, new Error('Storage is closed'))

  this._store('readonly', function (err, store) {
    if (err) {
      cb(err)
    } else {
      backify(store.get(index), function (err, ev) {
        if (err) {
          cb(err)
        } else if (ev.target.result === undefined) {
          cb(null, new Buffer(0))
        } else {
          var buf = new Buffer(JSON.parse(ev.target.result).data)
          if (!opts) return nextTick(cb, null, buf)
          var offset = opts.offset || 0
          var len = opts.length || (buf.length - offset)
          cb(null, buf.slice(offset, len + offset))
        }
      })
    }
  })
}

Storage.prototype.close = Storage.prototype.destroy = function (cb) {
  if (this.closed) return nextTick(cb, new Error('Storage is closed'))
  if (!this.db) return nextTick(cb, undefined)
  this.closed = true
  // self.db.close()
  nextTick(cb, null)
}

function nextTick (cb, err, val) {
  process.nextTick(function () {
    if (cb) cb(err, val)
  })
}

function backify (r, cb) {
  r.addEventListener('success', function (ev) { cb(null, ev) })
  r.addEventListener('error', function (err) { cb(err) })
}
