const { cleanEnv, url } = require('envalid')

const env = cleanEnv(
  process.env,
  {
    ETHEREUM_NODE_ENDPOINT: url({ devDefault: 'http://localhost:8545' }),
  },
  {
    strict: true,
  }
)

module.exports = env
