const test = require('ava')
const utils = require('../lib/utils.js')

test('encriptar password', t => {
  let password = 'foo123'
  let encrypted = '02b353bf5358995bc7d193ed1ce9c2eaec2b694b21d2f96232c9d6a0832121d1'
  let result = utils.encrypt(password)

  t.is(result, encrypted)
})
