'use strict'

const r = require('rethinkdb')
const co = require('co')
const Promise = require('bluebird')
const uuid = require('uuid-base62')
const utils = require('../lib/utils.js')

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
    this.setup = options.setup || false
  }

/* -------- Metodos de conexion y eliminacion de la db --------------- */

  // Metodo de conexion a la db
  connect (callback) {
    this.connection = r.connect({
      host: this.host,
      port: this.port
    })

    this.connected = true

    let connection = this.connection
    let db = this.db
    if (!this.setup) {
      return Promise.resolve(connection).asCallback(callback)
    }

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
        yield r.db(db).table('blogs').indexCreate('createdAt').run(conn)
      }

      if (dbTables.indexOf('imagenes') === -1) {
        yield r.db(db).tableCreate('imagenes').run(conn)
      }

      if (dbTables.indexOf('works') === -1) {
        yield r.db(db).tableCreate('works').run(conn)
        yield r.db(db).table('works').indexCreate('createdAt').run(conn)
      }

      if (dbTables.indexOf('users') === -1) {
        yield r.db(db).tableCreate('users').run(conn)
        yield r.db(db).table('users').indexCreate('username').run(conn)
      }

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

/* -------------- Metodos para guardar y listar blogs ------------------ */

  // Metodo para guardar un blog
  saveBlog (blog, callback) {
    if (!this.connected) {
      Promise.reject(new Error('Estas desconectado')).asCallback(callback)
    }

    let connection = this.connection
    let db = this.db

    let task = co.wrap(function * () {
      let conn = yield connection
      blog.createdAt = new Date()

      let result = yield r.db(db).table('blogs').insert(blog).run(conn)

      if (result.errors > 0) {
        return Promise.reject(new Error(result.first_error))
      }

      blog.id = result.generated_keys[0]

      yield r.db(db).table('blogs').get(blog.id).update({
        public_id: uuid.encode(blog.id)
      }).run(conn)

      let created = yield r.db(db).table('blogs').get(blog.id).run(conn)

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

      if (!blog) {
        return Promise.reject(new Error(`blog ${blogId} not found`))
      }
      return Promise.resolve(blog)
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
    let getBlog = this.getBlogDb.bind(this)

    let task = co.wrap(function * () {
      let conn = yield connection
      let blog = yield getBlog(id)

      yield r.db(db).table('blogs').get(blog.id).update({
        liked: true,
        likes: blog.likes + 1
      }).run(conn)

      let created = yield getBlog(id)

      return Promise.resolve(created)
    })
    return Promise.resolve(task()).asCallback(callback)
  }

  // Metodo para listar los Blogs
  getBlogsDb (callback) {
    if (!this.connected) {
      Promise.reject(new Error('Estas desconectado')).asCallback(callback)
    }

    let connection = this.connection
    let db = this.db

    let task = co.wrap(function * () {
      let conn = yield connection

      let blogs = yield r.db(db).table('blogs').orderBy({
        index: r.desc('createdAt')
      }).run(conn)

      let result = yield blogs.toArray()

      return Promise.resolve(result)
    })
    return Promise.resolve(task()).asCallback(callback)
  }

/* ----------- Metodos para los trabajos grabados y listados ------------ */

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

      yield r.db(db).table('works').get(work.id).update({
        public_id: uuid.encode(work.id)
      }).run(conn)

      let created = r.db(db).table('works').get(work.id).run(conn)

      return Promise.resolve(created)
    })
    return Promise.resolve(task()).asCallback(callback)
  }

  // Metodo para obtener un trabajo
  getWork (id, callback) {
    if (!this.connected) {
      return Promise.reject(new Error('no estas conectado'))
    }

    let connection = this.connection
    let db = this.db

    let task = co.wrap(function * () {
      let conn = yield connection
      let result = yield r.db(db).table('works').get(id).run(conn)

      return Promise.resolve(result)
    })
    return Promise.resolve(task()).asCallback(callback)
  }

  // Metodo para listar los trabajos
  getWorks (callback) {
    if (!this.connected) {
      return Promise.reject(new Error('no estas conectado'))
    }

    let connection = this.connection
    let db = this.db

    let task = co.wrap(function * () {
      let conn = yield connection
      let works = yield r.db(db).table('works').orderBy({
        index: r.desc('createdAt')
      }).run(conn)

      let result = yield works.toArray()

      return Promise.resolve(result)
    })
    return Promise.resolve(task()).asCallback(callback)
  }

/* ------------------ Metodos para guardar usuarios --------------------- */

  saveUser (user, callback) {
    if (!this.connected) {
      return Promise.reject(new Error('no estas conectado'))
    }

    let connection = this.connection
    let db = this.db

    let task = co.wrap(function * () {
      let conn = yield connection
      user.password = utils.encrypt(user.password)
      user.createdAt = new Date()

      let result = yield r.db(db).table('users').insert(user).run(conn)

      if (result.errors > 0) {
        return Promise.reject(new Error(result.first_error))
      }

      user.id = result.generated_keys[0]

      let created = yield r.db(db).table('users').get(user.id).run(conn)

      return Promise.resolve(created)
    })
    return Promise.resolve(task()).asCallback(callback)
  }

  getUser (username, callback) {
    if (!this.connected) {
      return Promise.reject(new Error('no estas conectado'))
    }

    let connection = this.connection
    let db = this.db

    let task = co.wrap(function * () {
      let conn = yield connection

      yield r.db(db).table('users').indexWait().run(conn)

      let users = yield r.db(db).table('users').getAll(username, {
        index: 'username'
      }).run(conn)

      let result = null

      try {
        result = yield users.next()
      } catch (e) {
        return Promise.reject(new Error(`user ${username} not found`))
      }

      return Promise.resolve(result)
    })
    return Promise.resolve(task()).asCallback(callback)
  }

  // Metodo para autenticar usuarios
  auth (username, password, callback) {
    if (!this.connected) {
      return Promise.reject(new Error('no estas conectado'))
    }

    let getUser = this.getUser.bind(this)

    let task = co.wrap(function * () {
      let user = null

      try {
        user = yield getUser(username)
      } catch (e) {
        return Promise.resolve(false)
      }

      if (user.password === utils.encrypt(password)) {
        return Promise.resolve(true)
      }

      return Promise.resolve(false)
    })
    return Promise.resolve(task()).asCallback(callback)
  }

}

module.exports = Db
