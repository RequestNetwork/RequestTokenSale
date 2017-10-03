// credit to : https://github.com/coldice/dbh-b9lab-hackathon/blob/development/truffle/utils/extensions.js
var _ = require("lodash");
module.exports = {

  init: function(web3, assert) {
    // From https://gist.github.com/xavierlepretre/88682e871f4ad07be4534ae560692ee6
    web3.eth.getTransactionReceiptMined = function(txnHash, interval) {
      var transactionReceiptAsync;
      interval = interval ? interval : 500;
      transactionReceiptAsync = function(txnHash, resolve, reject) {
        try {
          web3.eth.getTransactionReceiptPromise(txnHash)
            .then(function(receipt) {
              if (receipt == null) {
                setTimeout(function() {
                  transactionReceiptAsync(txnHash, resolve, reject);
                }, interval);
              } else {
                resolve(receipt);
              }
            });
        } catch (e) {
          reject(e);
        }
      };

      if (Array.isArray(txnHash)) {
        var promises = [];
        txnHash.forEach(function(oneTxHash) {
          promises.push(web3.eth.getTransactionReceiptMined(oneTxHash, interval));
        });
        return Promise.all(promises);
      } else {
        return new Promise(function(resolve, reject) {
          transactionReceiptAsync(txnHash, resolve, reject);
        });
      }
    };

    assert.isTxHash = function(txnHash, message) {
      assert(typeof txnHash === "string",
        'expected #{txnHash} to be a string',
        'expected #{txnHash} to not be a string');
      assert(txnHash.length === 66,
        'expected #{txnHash} to be a 66 character transaction hash (0x...)',
        'expected #{txnHash} to not be a 66 character transaction hash (0x...)');

      // Convert txnHash to a number. Make sure it's not zero.
      // Controversial: Technically there is that edge case where
      // all zeroes could be a valid address. But: This catches all
      // those cases where Ethereum returns 0x0000... if something fails.
      var number = web3.toBigNumber(txnHash, 16);
      assert(number.equals(0) === false,
        'expected address #{txnHash} to not be zero',
        'you shouldn\'t ever see this.');
    };
  },
  assertEvent: function(contract, filter) {
    return new Promise((resolve, reject) => {
      var event = contract[filter.event]();
      event.watch();
      event.get((error, logs) => {
        var log = _.filter(logs, filter);
        if (log && log.length > 0) {
          resolve(log);
        } else {
          throw Error("Failed to find filtered event for " + filter.event);
        }
      });
      event.stopWatching();
    });
  },
  // From https://gist.github.com/xavierlepretre/afab5a6ca65e0c52eaf902b50b807401
  getEventsPromise: function(myFilter, count, timeOut) {
    timeOut = timeOut ? timeOut : 1500000;
    var promise = new Promise(function(resolve, reject) {
      count = (typeof count !== "undefined") ? count : 1;
      var results = [];
      var toClear = setTimeout(function() {
        myFilter.stopWatching();
        reject(new Error("Timed out"));
      }, timeOut);
      myFilter.watch(function(error, result) {
        if (error) {
          clearTimeout(toClear);
          reject(error);
        } else {
          count--;
          results.push(result);
        }
        if (count <= 0) {
          clearTimeout(toClear);
          myFilter.stopWatching();
          resolve(results);
        }
      });
    });
    if (count == 0) {
      promise = promise
        .then(function(events) {
          throw "Expected to have no event";
        })
        .catch(function(error) {
          if (error.message != "Timed out") {
            throw error;
          }
        });
    }
    return promise;
  },

  // From https://gist.github.com/xavierlepretre/d5583222fde52ddfbc58b7cfa0d2d0a9
  expectedExceptionPromise: function(action, gasToUse, timeOut) {
    timeOut = timeOut ? timeOut : 5000;
    var promise = new Promise(function(resolve, reject) {
        try {
          resolve(action());
        } catch (e) {
          reject(e);
        }
      })
      .then(function(txObject) {
        // We are in Geth
        console.log("Geth mode : run out of gas. throw expected ?");
        assert.equal(txObject.receipt.gasUsed, gasToUse, "should have used all the gas");
      })
      .catch(function(e) {
        if ((e + "").indexOf("invalid JUMP") > -1 || (e + "").indexOf("out of gas") > -1) {
          // We are in TestRPC
          console.log("TestRPC mode : invalid JUMP or out of gas detected")
        } else if ((e + "").indexOf("please check your gas amount") > -1) {
          // We are in Geth for a deployment
          console.log("Geth mode : deployment in progress ...")
        } else if ((e + "").indexOf("Error: VM Exception while processing transaction: invalid opcode") > -1) {
          //see issue : https://github.com/trufflesuite/truffle/issues/498
          console.log("TestRPC mode : Error: VM Exception. throw expected ?");
        } else {
          throw e;
        }
      });

    return promise;
  },
  waitPromise: function(timeOut, toPassOn) {
    timeOut = timeOut ? timeOut : 1000;
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve(toPassOn);
      }, timeOut);
    });
  },
  signMessage: function(author, text) {
    /*
     * Sign a string and return (hash, v, r, s) used by ecrecover to regenerate the coinbase address;
     */
    let sha = web3.sha3(text);
    return web3.eth.signPromise(author, sha)
      .then(signPromise => {

        sig = signPromise.substr(2, signPromise.length);
        let r = '0x' + sig.substr(0, 64);
        let s = '0x' + sig.substr(64, 64);
        let v = web3.toDecimal(sig.substr(128, 2)) + 27;
        return {
          sha,
          v,
          r,
          s
        };
      });
  },
  makeSureAreUnlocked: function(accounts) {
    var requests = [];
    accounts.forEach(function(account, index) {
      requests.push(web3.eth.signPromise(
          account,
          "0x0000000000000000000000000000000000000000000000000000000000000000")
        .catch(function(error) {
          if (error.message == "account is locked") {
            throw Error("account " + account + " at index " + index + " is locked");
          } else {
            throw error;
          }
        }));
    });
    return Promise.all(requests);
  },
  gasTxUsedCost: function(txMined) {
    var gasUsed = txMined.receipt.gasUsed;
    return web3.eth.getTransactionPromise(txMined.tx)
      .then(tx => (tx.gasPrice * gasUsed));
  },
  getCurrentBlockTime: function() {
    return web3.eth.getBlockNumberPromise()
      .then(blockNumber => web3.eth.getBlockPromise(blockNumber))
      .then(block => block.timestamp);
  },
    getCurrentBlockNumber: function() {
        return web3.eth.getBlockNumberPromise()
            .then(blockNumber => blockNumber);
    },
  sleep: function(time) {
    console.log("wait " + time + " burning cpu")
    var d1 = new Date();
    var d2 = new Date();
    while (d2.valueOf() < d1.valueOf() + time) {
      d2 = new Date();
    }
  },
  iexecOperationId: function(user,provider,id) {
      let providerWithout0x = web3.toHex(provider).replace('0x', '');
      let idWithout0x = web3.toHex(id).replace('0x', '');
      return web3.sha3(user + providerWithout0x + idWithout0x, {
          encoding: 'hex'
      });
  },
  refillAccount: function(giver, receiver, minimalEtherNeeded) {
    return web3.eth.getBalancePromise(receiver)
      .then(balance => {
        if (balance.lessThan(web3.toWei(web3.toBigNumber(minimalEtherNeeded), "ether"))) {
          return web3.eth.sendTransactionPromise({
            from: giver,
            to: receiver,
            value: web3.toWei(web3.toBigNumber(minimalEtherNeeded), "ether")
          });
        }
      })
      .then(txSent => {
        if (txSent) {
          return web3.eth.getTransactionReceiptMined(txSent);
        }
      })
      .then(txMined => {
        if (txMined) {
          console.log("refill " + web3.toBigNumber(minimalEtherNeeded) + " ether to " + receiver);
        }
      });
  },
  isAddress: function(address) {
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
      // check if it has the basic requirements of an address
      return false;
    } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
      // If it's all small caps or all all caps, return true
      return true;
    } else {
      // Otherwise check each case
      address = address.replace('0x', '');
      var addressHash = web3.sha3(address.toLowerCase());

      for (var i = 0; i < 40; i++) {
        // the nth letter should be uppercase if the nth digit of casemap is 1
        if ((parseInt(addressHash[i], 16) > 8 && address[i].toUpperCase() != address[i]) || (parseInt(addressHash[i], 16) <= 8 && address[i].toLowerCase() != address[i])) {
          return false;
        }
      }
      return true;
    }
  }

};
