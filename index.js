'use strict'
const idb = require('idb')

const EventEmitter = require('events').EventEmitter
const queueMicrotask = require('queue-microtask')

class Storage extends EventEmitter {
  constructor (chunkLength, opts) {
    if (!opts) opts = {}
    super()

    this.chunkLength = Number(chunkLength)
    if (!this.chunkLength) throw new Error('First argument must be a chunk length')

    this.closed = false
    this.destroyed = false
    this.length = Number(opts.length) || Infinity
    this.name = opts.name || 'idb-chunk-store'

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
        this.closed = true
        this.emit('error', new Error('Database unexpectedly closed'))
      }
    })
  }

  put (index, buf, cb = () => {}) {
    if (this.closed) return queueMicrotask(() => cb(new Error('Storage is closed')))

    const isLastChunk = (index === this.lastChunkIndex)
    if (isLastChunk && buf.length !== this.lastChunkLength) {
      return queueMicrotask(() => cb(new Error('Last chunk length must be ' + this.lastChunkLength)))
    }
    if (!isLastChunk && buf.length !== this.chunkLength) {
      return queueMicrotask(() => cb(new Error('Chunk length must be ' + this.chunkLength)))
    }

    // Zero-copy coerce Buffer to Uint8Array
    buf = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)

    // If the backing buffer is larger, copy out only the relevant slice
    // so extra data doesn't get saved to indexeddb
    if (buf.byteOffset !== 0 || buf.byteLength !== buf.buffer.byteLength) {
      buf = buf.slice()
    }

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

  get (index, opts, cb = () => {}) {
    if (typeof opts === 'function') return this.get(index, {}, opts)
    if (!opts) opts = {}
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

      // rawResult should be undefined if the chunk is not found,
      // but some old browsers occasionally return null
      if (rawResult == null) {
        const err = new Error('Chunk not found')
        err.notFound = true
        cb(err)
        return
      }

      let buf = Buffer.from(rawResult.buffer, rawResult.byteOffset, rawResult.byteLength)

      const offset = opts.offset || 0
      const len = opts.length || (buf.length - offset)

      if (offset !== 0 || len !== buf.length) {
        buf = buf.slice(offset, len + offset)
      }

      cb(null, buf)
    })()
  }

  close (cb = () => {}) {
    if (this.closed) return queueMicrotask(() => cb(new Error('Storage is closed')))
    this.closed = true

    ;(async () => {
      try {
        const db = await this.dbPromise
        db.close()
      } catch (err) {
        cb(err)
        return
      }

      cb(null)
    })()
  }

  destroy (cb = () => {}) {
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
