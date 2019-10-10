const { cleanEnv, url } = require('envalid')

const specs = {
  BLOCKCHAIN_API_URL: url({ default: 'http://localhost:3042' }),
  ETHERSCAN_ENDPOINT: url({ default: 'https://kovan.etherscan.io' }),
}

module.exports = cleanEnv(process.env, specs, { strict: true })
