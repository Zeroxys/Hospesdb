'use strict'

const r = require('rethinkdb')
const co = require('co')
const Promise = require('bluebird')
const uuid = require('uuid-base62')

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

  // Metodo de conexion a la db
  connect (callback) {
    this.connection = r.connect({
      host: this.host,
      port: this.port
    })

    this.connected = true
    let connection = this.connection
    let db = this.db

    /* Metodo setup para verificar la creacion de la db
    y las tablas */
    let setup = co.wrap(function * () {
      let conn = yield connection

      let dbList = yield r.dbList().run(conn)
      if (dbList.indexOf(db) === -1) {
        yield r.dbCreate(db).run(conn)
      }

      let dbTables = yield r.db(db).tableList().run(conn)
      if (dbTables.indexOf('blogs') === -1) {
        yield r.db(db).tableCreate('blogs').run(conn)
      }

      if (dbTables.indexOf('imagenes') === -1) {
        yield r.db(db).tableCreate('imagenes').run(conn)
      }

      if (dbTables.indexOf('works') === -1) {
        yield r.db(db).tableCreate('works').run(conn)
      }

      // Devolvemos la conexion
      return conn
    })

    // resolvemos la funcion setup que contiene una promesa
    return Promise.resolve(setup()).asCallback(callback)
  }

  // Metodo para desconectarme de la db
  disconnect (callback) {
    if (!this.connected) {
      Promise.reject(new Error('Estas desconectado')).asCallback(callback)
    }
    this.connected = false
    Promise.resolve(this.connection).then(conn => conn.close())
  }

  // Metodo para guardar un blog
  saveBlog (blog, callback) {
    if (!this.connected) {
      Promise.reject(new Error('Estas desconectado')).asCallback(callback)
    }

    // Guardamos el contexto de la conexion
    let connection = this.connection
    let db = this.db

    /* Funcion que se ejecutara para guardar los blogs
    y creara la conexion a la db */
    let task = co.wrap(function * () {
      let conn = yield connection
      blog.createdAt = new Date()

      let result = yield r.db(db).table('blogs').insert(blog).run(conn)

      if (result.errors > 0) {
        return Promise.reject(new Error(result.first_error))
      }

      blog.id = result.generated_keys[0]

      // Actualizamos el id de la imagen con el work.id generado
      yield r.db(db).table('blogs').get(blog.id).update({
        public_id: uuid.encode(blog.id)
      }).run(conn)

      let created = yield r.db(db).table('blogs').get(blog.id).run(conn)

      return Promise.resolve(created)
    })

    return Promise.resolve(task()).asCallback(callback)
  }

  // Metodo para like al blog
  likeBlog (id, callback) {
    if (!this.connected) {
      Promise.reject(new Error('Estas desconectado')).asCallback(callback)
    }

    let connection = this.connection
    let db = this.db
    let blogId = uuid.decode(id)

    let task = co.wrap(function * () {
      let conn = yield connection
      let blog = yield r.db(db).table('blogs').get(blogId).run(conn)

      yield r.db(db).table('blogs').get(blogId).update({
        liked: true,
        likes: blog.likes + 1
      }).run(conn)

      let created = yield r.db(db).table('blogs').get(blogId).run(conn)

      return Promise.resolve(created)
    })
    return Promise.resolve(task()).asCallback(callback)
  }

  // Metodo para obtener un blog
  getBlogDb (id, callback) {
    if (!this.connected) {
      Promise.reject(new Error('Estas desconectado')).asCallback(callback)
    }

    let connection = this.connection
    let db = this.db
    let blogId = uuid.decode(id)

    let task = co.wrap(function * () {
      let conn = yield connection
      let blog = yield r.db(db).table('blogs').get(blogId).run(conn)

      return Promise.resolve(blog)
    })
    return Promise.resolve(task()).asCallback(callback)
  }

  // Metodo para guardar los trabajos
  saveWorks (work, callback) {
    if (!this.connected) {
      return Promise.reject(new Error('no estas conectado'))
    }

    let connection = this.connection
    let db = this.db

    let task = co.wrap(function * () {
      let conn = yield connection
      work.createdAt = new Date()

      let result = yield r.db(db).table('works').insert(work).run(conn)

      if (result.erros > 0) {
        return Promise.reject(new Error(result.first_error))
      }

      work.id = result.generated_keys[0]

      return Promise.resolve(work)
    })
    return Promise.resolve(task()).asCallback(callback)
  }
}

module.exports = Db
