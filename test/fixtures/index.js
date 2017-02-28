'use strict'

const uuid = require('uuid-base62')

const fixtures = {
  getBlog () {
    return {
      url_img: `https://hospes.com/${uuid.v4()}`,
      titulo: 'Titulo del blog',
      contenido: 'Contenido del blog',
      likes: 0,
      liked: false,
      blog_id: uuid.uuid()
    }
  },

  getBlogs (n) {
    let blogs = []
    while (n-- > 0) {
      blogs.push(this.getBlog())
    }
    return blogs
  },

  getWork () {
    return {
      url: [`https://hospes.com/works/work-01/${uuid.v4()}`, `https://hospes.com/works/work-02/${uuid.v4()}`],
      titulo: 'Trabajo numero X',
      descripcion: 'texto de descripcion de las imagenes',
      image_id: uuid.uuid()
    }
  }
}

module.exports = fixtures
