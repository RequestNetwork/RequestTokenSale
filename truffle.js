module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    }
  }
};


module.exports = {
  networks: {
    "live": {
      network_id: 1,
      host: "localhost",
      port: 8546   // Different than the default below
    },
	rinkeby: {
      network_id: 4,
      host: '127.0.0.1',
      port: 8545,
      gas: 4000000,
      from: "0xaccdd9bac6fdd4e730f183b9e450a0ec6fd8e3c7",
    },
  rpc: {
    host: "localhost",
    port: 8545,
    network_id: "*" // Match any network id
  }
  }
};