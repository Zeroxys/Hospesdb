const test = require('ava')
const Db = require('../')
const uuid = require('uuid-base62')
const r = require('rethinkdb')

const DbName = `Hospesdb_${uuid.v4()}`
const db = new Db({db: DbName})

test.before('conectando a la db', async t => {
  await db.connect()
  t.true(db.connected, 'deberias estar conectado a la db')
})

test.after('desconectando de la db', async t => {
  await db.disconnect()
  t.false(db.connected, 'esta conectado')
})

test.after.always('eliminar la db de prueba', async t => {
  let conn = await r.connect({})
  await r.dbDrop(DbName).run(conn)
})

test('mostrar un blog', async t => {
  t.pass()
})
