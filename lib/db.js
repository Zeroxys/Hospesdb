'use strict'

const r = require('rethinkdb')
const co = require('co')
const Promise = require('bluebird')

const defaults = {
  host: 'localhost',
  port: '28015',
  db: 'Hospesdb'
}

class Db {
  constructor (options) {
    options = options || {}
    this.host = options.port || defaults.host
    this.port = options.port || defaults.port
    this.db = options.db || defaults.db
  }

  connect (callback) {
    this.connection = r.connect({
      host: this.host,
      port: this.port
    })

    // Metodo para conectarme a la db
    this.connected = true
    let connection = this.connection
    let db = this.db

    let setup = co.wrap(function * () {
      let conn = yield connection

      let dbList = yield r.dbList().run(conn)
      if (dbList.indexOf(db) === -1) {
        yield r.dbCreate(db).run(conn)
      }

      let dbTables = yield r.db(db).tableList().run(conn)
      if (dbTables.indexOf('blogTheme') === -1) {
        yield r.db(db).tableCreate('blogTheme').run(conn)
      }

      if (dbTables.indexOf('imagenes') === -1) {
        yield r.db(db).tableCreate('imagenes').run(conn)
      }

      if (dbTables.indexOf('works') === -1) {
        yield r.db(db).tableCreate('works').run(conn)
      }

      return conn
    })

    // resolvemos la funcion setup que contiene una promesa
    return Promise.resolve(setup()).asCallback(callback)
  }

  // Metodo para desconectarme de la db
  disconnect (callback) {
    if (!this.connected) {
      Promise.reject(new Error('ya estas desconectado')).asCallback(callback)
    }
    this.connected = false
    Promise.resolve(this.connection).then(conn => conn.close())
  }
}

module.exports = Db
