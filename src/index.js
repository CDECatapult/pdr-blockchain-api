const { json, send } = require('micro')
const { URL } = require('url')
const nanoid = require('nanoid')
const schema = require('./schema')

async function loadBlock(req, res) {
  const url = new URL(req.url, 'http://[::]')
  const hash = url.pathname.slice(1)

  if (!hash.match(/^[a-f0-9]{96}$/)) {
    console.error(req.requestId, 'Hash is invalid', hash)
    return send(res, 400, { error: 'The hash is malformed' })
  }

  console.info(req.requestId, 'Loading block...')
  // TODO read tx from DB
  const tx = `0x3b31f11f926e330c1e0fb34a0f9607ba2765ba76f23b797095812c41907114e5`

  res.setHeader('Location', `https://etherscan.io/tx/${tx}`)
  res.statusCode = 302
  res.end()
}

async function createBlock(req, res) {
  console.info(req.requestId, 'Parsing the input...')
  let input
  try {
    input = await json(req)
    console.info(req.requestId, 'Input parsed')
  } catch (err) {
    console.error(req.requestId, 'Failed to parse the json', err)
    return send(res, 400, { error: 'The input is not a valid JSON' })
  }

  console.info(req.requestId, 'Validating input against schema...')
  const { error } = schema.validate(input)
  if (error) {
    console.error(req.requestId, 'Failed to validate the input', error)
    return send(res, 400, { error: 'The json input does not match the schema' })
  }
  console.info(req.requestId, 'Input validated')

  const { hash, date } = input
  console.log('Storing to the blockchain...', hash, date)
  // TODO actually store in blockchain...

  return send(res, 204)
}

module.exports = async (req, res) => {
  req.requestId = nanoid()

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST')
  res.setHeader('X-Request-ID', req.requestId)

  console.info(
    req.requestId,
    `Request ${req.method} from ${req.connection.remoteAddress}`
  )

  res.on('finish', () => {
    console.info(
      req.requestId,
      `Response ${res.statusCode} ${res.statusMessage}`
    )
  })

  switch (req.method.toUpperCase()) {
    case 'GET':
      return await loadBlock(req, res)
    case 'POST':
      return await createBlock(req, res)
    case 'OPTIONS':
      return send(res, 204, '')
    default:
      return send(res, 405, {
        error: `Invalid method, expected: POST, got: ${req.method}`,
      })
  }
}
