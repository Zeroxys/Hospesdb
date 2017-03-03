'use strict'

const crypto = require('crypto')

const utils = {
  encrypt
}

function encrypt (password) {
  let shasum = crypto.createHash('sha256')
  shasum.update(password)
  return shasum.digest('hex')
}

module.exports = utils
