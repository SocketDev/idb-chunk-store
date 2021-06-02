'use strict'
const idb = require('idb')

const EventEmitter = require('events').EventEmitter
const queueMicrotask = require('queue-microtask')

class Storage extends EventEmitter {
  constructor (chunkLength, opts) {
    if (!opts) opts = {}
    super()
    this.setMaxListeners(100)

    this.chunkLength = Number(chunkLength)
    if (!this.chunkLength) throw new Error('First argument must be a chunk length')

    this.closed = false
    this.destroyed = false
    this.length = Number(opts.length) || Infinity
    this.name = opts.name || 'chunksDB'

    if (this.length !== Infinity) {
      this.lastChunkLength = (this.length % this.chunkLength) || this.chunkLength
      this.lastChunkIndex = Math.ceil(this.length / this.chunkLength) - 1
    }

    this.dbPromise = idb.openDB(this.name, undefined, {
      upgrade: (db) => {
        db.createObjectStore('chunks')
      },
      blocking: () => {
        // Fires if the database is deleted from outside this Storage object
        this.close()
      },
      terminated: () => {
        this.emit('error', new Error('Database unexpectedly closed'))
      }
    })
  }

  put (index, buf, cb) {
    if (!cb) cb = () => {}
    if (this.closed) return queueMicrotask(() => cb(new Error('Storage is closed')))

    const isLastChunk = (index === this.lastChunkIndex)
    if (isLastChunk && buf.length !== this.lastChunkLength) {
      return queueMicrotask(() => cb(new Error('Last chunk length must be ' + this.lastChunkLength)))
    }
    if (!isLastChunk && buf.length !== this.chunkLength) {
      return queueMicrotask(() => cb(new Error('Chunk length must be ' + this.chunkLength)))
    }
    buf = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)

    ;(async () => {
      try {
        const db = await this.dbPromise
        await db.put('chunks', buf, index)
      } catch (err) {
        cb(err)
        return
      }

      cb(null)
    })()
  }

  get (index, opts, cb) {
    if (typeof opts === 'function') return this.get(index, null, opts)
    if (!opts) opts = {}
    if (!cb) cb = () => {}
    if (this.closed) return queueMicrotask(() => cb(new Error('Storage is closed')))

    ;(async () => {
      let rawResult
      try {
        const db = await this.dbPromise
        rawResult = await db.get('chunks', index)
      } catch (err) {
        cb(err)
        return
      }

      if (rawResult === undefined) {
        const err = new Error('Chunk not found')
        err.notFound = true
        cb(err)
        return
      }

      let buf = Buffer.from(rawResult)

      const offset = opts.offset || 0
      const len = opts.length || (buf.length - offset)

      if (offset !== 0 || len !== buf.length) {
        buf = buf.slice(offset, len + offset)
      }

      cb(null, buf)
    })()
  }

  close (cb) {
    if (!cb) cb = () => {}
    if (this.closed) return queueMicrotask(() => cb(new Error('Storage is closed')))
    this.closed = true

    this.dbPromise.then((db) => {
      db.close()

      cb(null)
    }, cb)
  }

  destroy (cb) {
    if (!cb) cb = () => {}
    if (this.closed) return queueMicrotask(() => cb(new Error('Storage is closed')))
    if (this.destroyed) return queueMicrotask(() => cb(new Error('Storage is destroyed')))
    this.destroyed = true

    this.close(async (err) => {
      if (err) {
        cb(err)
        return
      }

      try {
        await idb.deleteDB(this.name)
      } catch (err) {
        cb(err)
        return
      }

      cb(null)
    })
  }
}
module.exports = Storage

function nextTick (cb, err, val) {
  queueMicrotask(function () {
    if (cb) cb(err, val)
  })
}
