const test = require('ava')
const Db = require('../')
const uuid = require('uuid-base62')
const r = require('rethinkdb')

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

  let fixtures = {
    url_img: `https://hospes.com/${uuid.v4()}`,
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

// Test para guardar trabajos
test('Test para guardar los trabajos', async t => {
  t.is(typeof db.saveWorks, 'function', 'Deberia ser una funcion')

  let fixtures = {
    url: [`https://hospes.com/works/work-01/${uuid.v4()}`, `https://hospes.com/works/work-02/${uuid.v4()}`],
    titulo: 'Trabajo numero X',
    descripcion: 'texto de descripcion de las imagenes'
  }

  let created = await db.saveWorks(fixtures)

  t.deepEqual(created.url, fixtures.url)
  t.is(created.titulo, fixtures.titulo)
  t.is(created.descripcion, fixtures.descripcion)
  t.truthy(created.createdAt)
})
