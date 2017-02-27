const test = require('ava')
const Db = require('../')
const uuid = require('uuid-base62')
const r = require('rethinkdb')
const fixtures = require('./fixtures')

const DbName = `Hospesdb_${uuid.v4()}`
const db = new Db({db: DbName})

/* ------------------- AVA HOOK´s ------------------------------ */

test.before('conectando a la db', async t => {
  await db.connect()
  t.true(db.connected, 'deberias estar conectado a la db')
})

// despues de ejecutar los test
test.after('desconectando de la db', async t => {
  await db.disconnect()
  t.false(db.connected, 'esta conectado')
})

// siempre se ejecuta despues de los test
test.after.always('eliminar la db de prueba', async t => {
  let conn = await r.connect({})
  await r.dbDrop(DbName).run(conn)
})

/* ------------------------ Test´s ---------------------------- */

// Test para guardar un blog
test('Test para guardar un blog', async t => {
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
  t.is(typeof db.likeBlog, 'function', 'Deberia ser una funcion')

  let blog = fixtures.getBlog()
  let created = await db.saveBlog(blog)
  let result = await db.likeBlog(created.public_id)

  t.true(result.liked)
  t.is(result.likes, blog.likes + 1)
})

// Test para obtener un blog
test('Test para obtener un blog', async t => {
  t.is(typeof db.getBlogDb, 'function', 'Deberia ser una funcion')

  let blog = fixtures.getBlog()
  let created = await db.saveBlog(blog)
  let result = await db.getBlogDb(created.public_id)

  t.deepEqual(created, result)
})

// Test para guardar los trabajos
test('Test para guardar los trabajos', async t => {
  t.is(typeof db.saveWorks, 'function', 'Deberia ser una funcion')

  let work = fixtures.getWork()

  let created = await db.saveWorks(work)

  t.deepEqual(created.url, work.url)
  t.is(created.titulo, work.titulo)
  t.is(created.descripcion, work.descripcion)
  t.truthy(created.createdAt)
})
