const { json, send } = require('micro')
const { URL } = require('url')
const nanoid = require('nanoid')
const got = require('got')
const env = require('./env')
const schema = require('./schema')

const blockchain = got.extend({
  baseUrl: env.BLOCKCHAIN_API_URL,
  json: true,
  form: true,
})

async function loadBlock(req, res) {
  const url = new URL(req.url, 'http://[::]')
  const hash = url.pathname.slice(1)

  if (!hash.match(/^[a-f0-9]{96}$/)) {
    console.error(req.requestId, 'Hash is invalid', hash)
    return send(res, 400, { error: 'The hash is malformed' })
  }

  console.info(req.requestId, 'Loading block...')
  let tx
  try {
    const { body } = await blockchain.get(`hash?hash=${hash}`)
    tx = body.transactionHash
    console.info(`Block loaded:`, body)
  } catch (err) {
    console.error(`Could not load the block`, err)
    return send(res, 520, { error: 'Could not load the block' })
  }

  res.setHeader('Location', `${env.ETHERSCAN_ENDPOINT}/tx/${tx}`)
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
  console.log('Pushing to the blockchain...', hash, date)
  try {
    const { body } = await blockchain.post(`hash`, { body: { hash } })
    console.info(
      `Pushed to the blockchain, transactionHash: ${body.transactionHash}`
    )
  } catch (err) {
    console.error(req.requestId, 'Failed to post to the blockchain', err)
    return send(res, 400, { error: 'Failed to save to the blockchain' })
  }

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
