const Web3 = require('web3')
const env = require('./env')

const web3 = new Web3(env.ETHEREUM_NODE_ENDPOINT)

module.exports = web3
