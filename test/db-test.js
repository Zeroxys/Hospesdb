const test = require('ava')
const Db = require('../')
const uuid = require('uuid-base62')
const r = require('rethinkdb')
const fixtures = require('./fixtures')
const utils = require('../lib/utils.js')

/* ------------------- AVA HOOK´s ------------------------------ */

test.beforeEach('conectando a la db', async t => {
  const DbName = `Hospesdb_${uuid.v4()}`
  const db = new Db({db: DbName, setup: true})
  await db.connect()
  t.context.DbName = DbName
  t.context.db = db
  t.true(db.connected, 'deberias estar conectado a la db')
})

// despues de ejecutar los test
test.afterEach.always('desconectando y limpiando la db', async t => {
  let db = t.context.db
  let DbName = t.context.DbName

  await db.disconnect()
  t.false(db.connected, 'esta conectado')

  let conn = await r.connect({})
  await r.dbDrop(DbName).run(conn)
})

/* ------------------------ Test´s Blogs ---------------------------- */

// Test para guardar un blog
test('Test para guardar un blog', async t => {
  let db = t.context.db
  t.is(typeof db.saveBlog, 'function', 'deberia ser function')

  let blog = fixtures.getBlog()

  let created = await db.saveBlog(blog)

  t.is(created.titulo, blog.titulo)
  t.is(created.contenido, blog.contenido)
  t.is(created.likes, blog.likes)
  t.is(created.liked, blog.liked)
  t.is(created.blog_id, blog.blog_id)
  t.is(typeof created.id, 'string')
  t.truthy(created.createdAt)
  t.is(created.public_id, uuid.encode(created.id))
})

// Test para darle like al blog
test('Test para like blog', async t => {
  let db = t.context.db
  t.is(typeof db.likeBlog, 'function', 'Deberia ser una funcion')

  let blog = fixtures.getBlog()
  let created = await db.saveBlog(blog)
  let result = await db.likeBlog(created.public_id)

  t.true(result.liked)
  t.is(result.likes, blog.likes + 1)
})

// Test para obtener un blog
test('Test para obtener un blog', async t => {
  let db = t.context.db
  t.is(typeof db.getBlogDb, 'function', 'Deberia ser una funcion')

  let blog = fixtures.getBlog()
  let created = await db.saveBlog(blog)
  let result = await db.getBlogDb(created.public_id)

  t.deepEqual(created, result)

  t.throws(db.getBlogDb('foo'), /not found/)
})

// Test para listar todos los blogs
test('Test para listar todos blogs de forma descendente', async t => {
  let db = t.context.db
  let blogs = fixtures.getBlogs()

  let saveBlogs = blogs.map((blog) => { db.saveBlog(blog) })
  let created = await Promise.all(saveBlogs)

  let result = await db.getBlogsDb()

  t.is(created.length, result.length)
})

/* ------------------------ Test´s Works ---------------------------- */

// Test para guardar los trabajos
test('Test para guardar los trabajos', async t => {
  let db = t.context.db
  t.is(typeof db.saveWorks, 'function', 'Deberia ser una funcion')

  let work = fixtures.getWork()

  let created = await db.saveWorks(work)

  t.deepEqual(created.url, work.url)
  t.is(created.titulo, work.titulo)
  t.is(created.descripcion, work.descripcion)
  t.truthy(created.createdAt)
})

// Test para obtener un trabajo
test('Test para obtener un trabajo', async t => {
  let db = t.context.db

  let work = fixtures.getWork()
  let created = await db.saveWorks(work)
  let result = await db.getWork(created.id)

  t.is(typeof db.getWork, 'function', 'debeberia ser una funcion')
  t.deepEqual(created, result)
})

// Test para listar todos los trabajos
test('Test para listar todos los trabajos', async t => {
  let db = t.context.db
  t.is(typeof db.getWorks, 'function', 'Deberia ser una funcion')

  let works = fixtures.getWorks()
  let saveWorks = works.map((work) => { db.saveWorks(work) })
  let created = await Promise.all(saveWorks)

  let result = await db.getWorks()

  t.is(created.length, result.length)
})

/* --------------- Test´s para la creacion de usuario ------------------ */

// Test para verificar usuario guardado
test('Guardando un usuario', async t => {
  let db = t.context.db
  t.is(typeof db.saveUser, 'function', 'Deberia ser una funcion')
  let user = fixtures.getUser()
  let plainPassword = user.password
  let created = await db.saveUser(user)

  t.is(created.username, user.username)
  t.is(created.name, user.name)
  t.is(created.email, user.email)
  t.is(utils.encrypt(plainPassword), created.password)
  t.is(typeof created.id, 'string')
  t.truthy(created.createdAt)
})

// Test para traerme un usuario
test('Test para traerme un usuario', async t => {
  let db = t.context.db
  t.is(typeof db.getUser, 'function', 'deberia ser una funcion')
  let user = fixtures.getUser()
  let created = await db.saveUser(user)

  let result = await db.getUser(user.username)

  t.deepEqual(created, result)

  t.throws(db.getUser('foo'), /not found/)
})

// Metodo de autenticacion de usuarios
test('Test para autenticar usuarios', async t => {
  let db = t.context.db
  t.is(typeof db.auth, 'function', 'deberia ser una funcion')
  let user = fixtures.getUser()
  let plainPassword = user.password
  await db.saveUser(user)

  let success = await db.auth(user.username, plainPassword)
  t.true(success)

  let fail = await db.auth(user.username, 'foo')
  t.false(fail)

  let failure = await db.auth('foo', 'bar')
  t.false(failure)
})
