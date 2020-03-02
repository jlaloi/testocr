const {createWorker} = require('tesseract.js')
const fastify = require('fastify')({
  logger: true,
  bodyLimit: 1024 * 1024 * 1024,
})
const fStatic = require('fastify-static')

const path = require('path')
const fs = require('fs').promises

const PATH_PUBLIC = 'public'
const PATH_IMG = 'img'
const SERVER_PORT = 3000

fastify.register(fStatic, {
  root: path.join(__dirname, PATH_PUBLIC),
})

fastify.route({
  method: 'GET',
  url: '/images',
  handler: async () => (await fs.readdir(path.join(__dirname, PATH_PUBLIC, PATH_IMG))).map(i => `${PATH_IMG}/${i}`),
})

fastify.route({
  method: 'POST',
  url: '/ocr',
  handler: async (request, reply) => {
    const {img, rectangle, lang = 'fra'} = request.body
    const worker = createWorker({
      logger: m => request.log.info(m),
      errorHandler: err => request.log.error(err),
    })
    await worker.load()
    await worker.loadLanguage(lang)
    await worker.initialize(lang)
    const {
      data: {text},
    } = await worker.recognize(img, {rectangle})
    await worker.terminate()
    reply.send({text})
  },
})

const start = async () => {
  try {
    await fastify.listen(SERVER_PORT)
    fastify.log.info(`server listening on ${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
