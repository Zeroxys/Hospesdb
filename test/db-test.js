const test = require('ava')
const Db = require('../')
const uuid = require('uuid-base62')
const r = require('rethinkdb')

const DbName = `Hospesdb_${uuid.v4()}`
const db = new Db({db: DbName})

// antes de ejecutar los test
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

// test para guardar un blog
test('Guardar un blog', async t => {
  t.is(typeof db.saveBlog, 'function', 'deberia ser function')

  let fixtures = {
    titulo: 'Titulo del blog',
    contenido: 'Contenido del blog',
    likes: 0,
    liked: false,
    blog_id: uuid.uuid()
  }

  let created = await db.saveBlog(fixtures)

  t.is(created.titulo, fixtures.titulo)
  t.is(created.contenido, fixtures.contenido)
  t.is(created.likes, fixtures.likes)
  t.is(created.liked, fixtures.liked)
  t.is(created.blog_id, fixtures.blog_id)
  t.is(typeof created.id, 'string')
  t.truthy(created.createdAt)
})
