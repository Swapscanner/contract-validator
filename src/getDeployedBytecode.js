const web3 = require('./web3');

module.exports = async (address) => (await web3.eth.getCode(address)).substr(2);
