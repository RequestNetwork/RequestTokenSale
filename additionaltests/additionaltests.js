var RequestTokenSale = artifacts.require("./RequestTokenSale.sol");
var RequestToken = artifacts.require("./RequestToken.sol");




const Promise = require("bluebird");
//extensions.js : credit to : https://github.com/coldice/dbh-b9lab-hackathon/blob/development/truffle/utils/extensions.js
const Extensions = require("../utils/extensions.js");
const addEvmFunctions = require("../utils/evmFunctions.js");
addEvmFunctions(web3);
Promise.promisifyAll(web3.eth, {
  suffix: "Promise"
});
Promise.promisifyAll(web3.version, {
  suffix: "Promise"
});
Promise.promisifyAll(web3.evm, {
  suffix: "Promise"
});
Extensions.init(web3, assert);


contract('RequestTokenSale', function(accounts) {

  var admin;
  var foundationWallet;
  var earlyInvestorWallet;
  var vestingWallet;
  var randomGuy1;
  var randomGuy2;
  var amountGazProvided = 4000000;
  var gasPriceUnderLimit = 40000000000;
  var gasPriceOverLimit = 60000000000;
  let isTestRPC;
  let testTimemout = 0;


  const decimals18 = "000000000000000000";


  // tool const ----------------------------------------------------------------------------
  const day = 60 * 60 * 24 * 1000;
  const dayInsecond = 60 * 60 * 24;
  const second = 1000;

  var currentTimeStamp;
  var startTimeSolidity;
  var endTimeSolidity;

  before("should prepare accounts and check TestRPC Mode", function() {
    assert.isAtLeast(accounts.length, 4, "should have at least 4 accounts");
    admin = accounts[0];
    foundationWallet = accounts[1];
    earlyInvestorWallet = accounts[2];
    vestingWallet = accounts[3];
    randomGuy1 = accounts[4];
    randomGuy2 = accounts[5];
    return Extensions.makeSureAreUnlocked(
        [admin, randomGuy1, randomGuy2])
      .then(() => web3.eth.getBalancePromise(admin))
      .then(balance => assert.isTrue(
        web3.toWei(web3.toBigNumber(90), "ether").lessThan(balance),
        "creator should have at least 35 ether, not " + web3.fromWei(balance, "ether")))
      .then(() => Extensions.refillAccount(admin, randomGuy1, 30))
      .then(() => Extensions.refillAccount(admin, randomGuy2, 30))
      .then(() => web3.version.getNodePromise())
      .then(node => isTestRPC = node.indexOf("EthereumJS TestRPC") >= 0);
  });

  describe("On T - 5 days,'We manually verify that preminted tokens were assigned to the correct addresses'", function() {
    var aRequestTokenSaleInstance;
    var aRequestTokenInstance;
    beforeEach("create a new RequestTokenSale contract instance", function() {
      currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      startTimeSolidity = currentTimeStamp + 2 * dayInsecond;
      endTimeSolidity = startTimeSolidity + 3 * dayInsecond;
      return RequestTokenSale.new(startTimeSolidity, endTimeSolidity, {
          from: admin
        })
        .then(instance => {
          aRequestTokenSaleInstance = instance;
          return aRequestTokenSaleInstance.token.call()
        }).
      then(instance => {
        aRequestTokenInstance = RequestToken.at(instance);
      });
    });

    it("Test Early Backers & Investors: 20% =>  200000000 REQ", function() {
      return aRequestTokenInstance.balanceOf.call(earlyInvestorWallet)
        .then(balance => {
          assert.strictEqual(balance.toString(10), "200000000" + decimals18, "earlyInvestorWallet");
        });
    });


    it("Test  Team and advisors (current & future): 15%  => 150000000 REQ ", function() {
      return aRequestTokenInstance.balanceOf.call(foundationWallet)
        .then(balance => {
          assert.strictEqual(balance.toString(10), "150000000" + decimals18, "foundationWallet");
        });
    });


    it("Test Retained by Request and external Development Fund: 15% => 150000000 REQ ", function() {
      return aRequestTokenInstance.balanceOf.call(vestingWallet)
        .then(balance => {
          assert.strictEqual(balance.toString(10), "150000000" + decimals18, "vestingWallet");
        });
    });


    it("Test Crowdsale Fund  : Crowdsale: 50% => 500000000 REQ ", function() {
      return aRequestTokenInstance.balanceOf.call(aRequestTokenSaleInstance.address)
        .then(balance => {
          assert.strictEqual(balance.toString(10), "500000000" + decimals18, "Crowdsale Fund");
        });
    });
  });




  describe("On T - 5 days,'we list users for the whitelist The listing'", function() {
    var aRequestTokenSaleInstance;
    var aRequestTokenInstance;
    beforeEach("create a new RequestTokenSale contract instance", function() {
      currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      startTimeSolidity = currentTimeStamp + 2 * dayInsecond;
      endTimeSolidity = startTimeSolidity + 3 * dayInsecond;
      return RequestTokenSale.new(startTimeSolidity, endTimeSolidity, {
          from: admin
        })
        .then(instance => {
          aRequestTokenSaleInstance = instance;
          return aRequestTokenSaleInstance.token.call()
        }).
      then(instance => {
        aRequestTokenInstance = RequestToken.at(instance);
      });
    });

    it("Test admin can add to white list", function() {
      return aRequestTokenSaleInstance.changeRegistrationStatus(randomGuy1, true, {
          from: admin,
          gas: amountGazProvided
        })
        .then(txMined => {
          assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
        })
    });

    it("Test randomGuy1 can't add to white list", function() {
      return Extensions.expectedExceptionPromise(function() {
          return aRequestTokenSaleInstance.changeRegistrationStatus(randomGuy1, true, {
            from: randomGuy1,
            gas: amountGazProvided
          });
        },
        amountGazProvided);
    });

  });



  describe("On T - 5 days, test that randomGuy1 can't purchase", function() {
    var aRequestTokenSaleInstance;
    var aRequestTokenInstance;
    beforeEach("create a new RequestTokenSale contract instance", function() {
      currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      startTimeSolidity = currentTimeStamp + 2 * dayInsecond;
      endTimeSolidity = startTimeSolidity + 3 * dayInsecond;
      return RequestTokenSale.new(startTimeSolidity, endTimeSolidity, {
          from: admin
        })
        .then(instance => {
          aRequestTokenSaleInstance = instance;
          return aRequestTokenSaleInstance.token.call()
        }).
      then(instance => {
        aRequestTokenInstance = RequestToken.at(instance);
      });
    });

    it("On T - 5 days, try to buyTokens by  ", function() {
      return Extensions.expectedExceptionPromise(function() {
          return aRequestTokenSaleInstance.buyTokens({
            from: randomGuy1,
            gas: amountGazProvided,
            gasPrice: gasPriceUnderLimit,
            value: web3.toWei(1, "ether")
          });
        },
        amountGazProvided);
    });
  });


  // early investors multisig wallet, the foundation multisig wallet and the token sale contract
  describe("On T - 5 days, Token transfers are enabled only for the early investors multisig wallet, the foundation multisig wallet and the token sale contract", function() {
    var aRequestTokenSaleInstance;
    var aRequestTokenInstance;
    beforeEach("create a new RequestTokenSale contract instance", function() {
      currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      startTimeSolidity = currentTimeStamp + 2 * dayInsecond;
      endTimeSolidity = startTimeSolidity + 3 * dayInsecond;
      return RequestTokenSale.new(startTimeSolidity, endTimeSolidity, {
          from: admin
        })
        .then(instance => {
          aRequestTokenSaleInstance = instance;
          return aRequestTokenSaleInstance.token.call()
        }).
      then(instance => {
        aRequestTokenInstance = RequestToken.at(instance);
      });
    });

    it("Test Early Backers & Investors can do transfert ", function() {
      return aRequestTokenInstance.balanceOf.call(earlyInvestorWallet)
        .then(balance => {
          assert.strictEqual(balance.toString(10), "200000000" + decimals18, "earlyInvestorWallet");
          return aRequestTokenInstance.transfer(randomGuy1, 2, {
            from: earlyInvestorWallet,
            gas: amountGazProvided,
            gasPrice: gasPriceUnderLimit
          });
        })
        .then(txMined => {
          assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
          return aRequestTokenInstance.balanceOf.call(earlyInvestorWallet);
        })
        .then(balance => {
          assert.strictEqual(balance.toString(10), "199999999999999999999999998", "earlyInvestorWallet");
          return aRequestTokenInstance.balanceOf.call(randomGuy1);
        })
        .then(balance => {
          assert.strictEqual(balance.toString(10), "2", "randomGuy1 has 2 REQ from earlyInvestorWallet");
          return Extensions.expectedExceptionPromise(function() {
              //randomGuy1 can't transfer to randomGuy2
              return aRequestTokenInstance.transfer(randomGuy2, 1, {
                from: randomGuy1,
                gas: amountGazProvided,
                gasPrice: gasPriceUnderLimit
              });
            },
            amountGazProvided);
        });
    });

    it("Test foundation multisig wallet can do transfert ", function() {
      return aRequestTokenInstance.balanceOf.call(foundationWallet)
        .then(balance => {
          assert.strictEqual(balance.toString(10), "150000000" + decimals18, "foundationWallet");
          return aRequestTokenInstance.transfer(admin, 2, {
            from: foundationWallet,
            gas: amountGazProvided,
            gasPrice: gasPriceUnderLimit
          });
        })
        .then(txMined => {
          assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
          return aRequestTokenInstance.balanceOf.call(foundationWallet);
        })
        .then(balance => {
          assert.strictEqual(balance.toString(10), "149999999999999999999999998", "foundationWallet");
          return aRequestTokenInstance.balanceOf.call(admin);
        })
        .then(balance => {
          assert.strictEqual(balance.toString(10), "2", "admin has 2 REQ from foundationWallet");
          return Extensions.expectedExceptionPromise(function() {
              //admin can't transfer to randomGuy2
              return aRequestTokenInstance.transfer(randomGuy2, 1, {
                from: admin,
                gas: amountGazProvided,
                gasPrice: gasPriceUnderLimit
              });
            },
            amountGazProvided);
        });
    });

    //note :
    //owners, admins who are you ...
    //the owner of the RequestToken (call _admin in RequestToken constractor ) is the multisig fondation wallet. can do emergencyEthDrain and emergencyERC20Drain . different from the _owner usage
    //owner of the tokencrowndsale is an admin user not the muti sig fondation

    describe("On T - 3, We compute the individual cap and set it up on the blockchain thanks to the entry RequestTokenSale/setBaseEthCapPerAddress()", function() {
      var aRequestTokenSaleInstance;
      var aRequestTokenInstance;
      beforeEach("create a new RequestTokenSale contract instance", function() {
        currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
        startTimeSolidity = currentTimeStamp + 5 * dayInsecond;
        endTimeSolidity = startTimeSolidity + 6 * dayInsecond;
        return RequestTokenSale.new(startTimeSolidity, endTimeSolidity, {
            from: admin
          })
          .then(instance => {
            aRequestTokenSaleInstance = instance;
            return aRequestTokenSaleInstance.token.call()
          }).
        then(instance => {
          aRequestTokenInstance = RequestToken.at(instance);
        });
      });

      it("On T - 5 days, try  to call setBaseEthCapPerAddress by random guy   ", function() {
        return Extensions.expectedExceptionPromise(function() {
            return aRequestTokenSaleInstance.setBaseEthCapPerAddress(web3.toWei(1, "ether"), {
              from: randomGuy1,
              gas: amountGazProvided

            });
          },
          amountGazProvided);
      });

      it("On T - 5 days, call setBaseEthCapPerAddress by admin  ", function() {
        return aRequestTokenSaleInstance.setBaseEthCapPerAddress(web3.toWei(1, "ether"), {
            from: admin,
            gas: amountGazProvided
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
            return aRequestTokenSaleInstance.baseEthCapPerAddress.call();
          }).then(baseEthCapPerAddress => assert.strictEqual(baseEthCapPerAddress.toString(10), web3.toWei(1, "ether").toString(10), "baseEthCapPerAddress"));
      });
    });


    describe("On T-1, baseEthCapPerAddress and whitelist are not modifiable anymore. ", function() {
      var aRequestTokenSaleInstance;
      var aRequestTokenInstance;
      beforeEach("create a new RequestTokenSale contract instance", function() {
        currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
        startTimeSolidity = currentTimeStamp + 5 * dayInsecond;
        endTimeSolidity = startTimeSolidity + 6 * dayInsecond;
        return RequestTokenSale.new(startTimeSolidity, endTimeSolidity, {
            from: admin
          })
          .then(instance => {
            aRequestTokenSaleInstance = instance;
            return aRequestTokenSaleInstance.token.call()
          }).
        then(instance => {
          aRequestTokenInstance = RequestToken.at(instance);
        });
      });

      it("On T - 1 days, can't setBaseEthCapPerAddress by admin anymore  ", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        // simulate wait of 4 of 5 days = the deadline
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 4);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 4);
            return Extensions.expectedExceptionPromise(function() {
                return aRequestTokenSaleInstance.setBaseEthCapPerAddress(web3.toWei(1, "ether"), {
                  from: admin,
                  gas: amountGazProvided
                });
              },
              amountGazProvided);
          });
      });

      it("Test admin can't add to white list at T-1", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        // simulate wait of 4 of 5 days = the deadline
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 4);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 4);
            return Extensions.expectedExceptionPromise(function() {
                return aRequestTokenSaleInstance.changeRegistrationStatus(randomGuy1, true, {
                  from: admin,
                  gas: amountGazProvided
                });
              },
              amountGazProvided);
          });
      });
    });



    describe("T, the sale starts. T+1, T+2 T+3 T+4 T+7 tests", function() {
      var aRequestTokenSaleInstance;
      var aRequestTokenInstance;
      beforeEach("create a new RequestTokenSale contract instance", function() {
        currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
        startTimeSolidity = currentTimeStamp + 5 * dayInsecond;
        endTimeSolidity = startTimeSolidity + 4 * dayInsecond;
        return RequestTokenSale.new(startTimeSolidity, endTimeSolidity, {
            from: admin
          })
          .then(instance => {
            aRequestTokenSaleInstance = instance;
            return aRequestTokenSaleInstance.token.call()
          }).
        then(instance => {
            aRequestTokenInstance = RequestToken.at(instance);
            return aRequestTokenSaleInstance.changeRegistrationStatus(randomGuy1, true, {
              from: admin,
              gas: amountGazProvided
            });
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
            return aRequestTokenSaleInstance.setBaseEthCapPerAddress(web3.toWei(2, "ether"), {
              from: admin,
              gas: amountGazProvided
            });
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
            return aRequestTokenSaleInstance.baseEthCapPerAddress.call();
          }).then(baseEthCapPerAddress => assert.strictEqual(baseEthCapPerAddress.toString(10), web3.toWei(2, "ether").toString(10), "baseEthCapPerAddress"));
      });


      it("On T - 5 days, randomGuy1 can't buy REQ Tokens", function() {
        return Extensions.expectedExceptionPromise(function() {
            return aRequestTokenSaleInstance.buyTokens({
              from: randomGuy1,
              gas: amountGazProvided,
              gasPrice: gasPriceUnderLimit,
              value: web3.toWei(1, "ether")
            });
          },
          amountGazProvided);
      });

      it("On T - 4 days, randomGuy1 can't buy REQ Tokens", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        // simulate wait of 1 of 5 days
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 1);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 1);
            return Extensions.expectedExceptionPromise(function() {
                return aRequestTokenSaleInstance.buyTokens({
                  from: randomGuy1,
                  gas: amountGazProvided,
                  gasPrice: gasPriceUnderLimit,
                  value: web3.toWei(1, "ether")
                });
              },
              amountGazProvided);
          });
      });


      it("On T - 3 days, randomGuy1 can't buy REQ Tokens", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        // simulate wait of 2 of 5 days
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 2);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 2);
            return Extensions.expectedExceptionPromise(function() {
                return aRequestTokenSaleInstance.buyTokens({
                  from: randomGuy1,
                  gas: amountGazProvided,
                  gasPrice: gasPriceUnderLimit,
                  value: web3.toWei(1, "ether")
                });
              },
              amountGazProvided);
          });
      });

      it("On T - 2 days, randomGuy1 can't buy REQ Tokens", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        // simulate wait of 3 of 5 days
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 3);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 3);
            return Extensions.expectedExceptionPromise(function() {
                return aRequestTokenSaleInstance.buyTokens({
                  from: randomGuy1,
                  gas: amountGazProvided,
                  gasPrice: gasPriceUnderLimit,
                  value: web3.toWei(1, "ether")
                });
              },
              amountGazProvided);
          });
      });

      it("On T - 1 day, randomGuy1 can't buy REQ Tokens", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        // simulate wait of 4 of 5 days
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 4);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 4);
            return Extensions.expectedExceptionPromise(function() {
                return aRequestTokenSaleInstance.buyTokens({
                  from: randomGuy1,
                  gas: amountGazProvided,
                  gasPrice: gasPriceUnderLimit,
                  value: web3.toWei(1, "ether")
                });
              },
              amountGazProvided);
          });
      });


      it("On T day, registered randomGuy1 can buy REQ Tokens, many time (twice here), but can't tranfer it yet (until T + 7) ", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        // simulate wait of 5 of 5 days = the crowdsale day
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 5);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 5);
            return aRequestTokenSaleInstance.buyTokens({
              from: randomGuy1,
              gas: amountGazProvided,
              gasPrice: gasPriceUnderLimit,
              value: web3.toWei(1, "ether")
            });
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
            return aRequestTokenSaleInstance.buyTokens({
              from: randomGuy1,
              gas: amountGazProvided,
              gasPrice: gasPriceUnderLimit,
              value: web3.toWei(1, "ether")
            });
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
            return aRequestTokenInstance.balanceOf(randomGuy1);
          })
          .then(balance => {
            //-10000000000000000000000
            //RATE_ETH_REQ = 5000 REQ / ether
            // 2 ether invest => 10 0000 REQ
            assert.strictEqual(balance.toString(10), "10000" + decimals18, "randomGuy1 balance must be 10000 REQ");
            return Extensions.expectedExceptionPromise(function() {
                //randomGuy1 can't transfer to randomGuy2 before T +7
                return aRequestTokenInstance.transfer(randomGuy2, 1, {
                  from: randomGuy1,
                  gas: amountGazProvided,
                  gasPrice: gasPriceUnderLimit
                });
              },
              amountGazProvided);
          })
          .then(() => {
            // but earlyInvestorWallet still can
            return aRequestTokenInstance.transfer(randomGuy2, 1, {
              from: earlyInvestorWallet,
              gas: amountGazProvided,
              gasPrice: gasPriceUnderLimit
            });
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
            return web3.evm.increaseTimePromise(dayInsecond * 7);
          })
          .then(() => {
            //now randomGuy1 can transfer to randomGuy2 after T +7
            return aRequestTokenInstance.transfer(randomGuy2, 1, {
              from: randomGuy1,
              gas: amountGazProvided,
              gasPrice: gasPriceUnderLimit
            });
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
            return aRequestTokenSaleInstance.weiRaised.call();
          })
          .then(balance => {
            assert.strictEqual(balance.toString(10), web3.toWei(2, "ether").toString(10), "weiRaised 2 ethers");
          });

      });

      it("On T day, registered randomGuy1 can't buy REQ Tokens over the cap limit per address (2 ethers)", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        // simulate wait of 5 of 5 days = the crowdsale day
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 5);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 5);
            return Extensions.expectedExceptionPromise(function() {
                return aRequestTokenSaleInstance.buyTokens({
                  from: randomGuy1,
                  gas: amountGazProvided,
                  gasPrice: gasPriceUnderLimit,
                  value: web3.toWei(3, "ether")
                });
              },
              amountGazProvided);
          });
      });



      it("On T day, registered randomGuy1 can't buy REQ Tokens with gasPrice Over Limit (to prevent wales)", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        // simulate wait of 5 of 5 days = the crowdsale day
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 5);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 5);
            return Extensions.expectedExceptionPromise(function() {
                return aRequestTokenSaleInstance.buyTokens({
                  from: randomGuy1,
                  gas: amountGazProvided,
                  gasPrice: gasPriceOverLimit,
                  value: web3.toWei(1, "ether")
                });
              },
              amountGazProvided);
          });
      });

      it("On T day, unregistered randomGuy2 can't buy REQ Tokens", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        // simulate wait of 5 of 5 days = the crowdsale day
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 5);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 5);
            return Extensions.expectedExceptionPromise(function() {
                return aRequestTokenSaleInstance.buyTokens({
                  from: randomGuy2,
                  gas: amountGazProvided,
                  gasPrice: gasPriceUnderLimit,
                  value: web3.toWei(1, "ether")
                });
              },
              amountGazProvided);
          });
      });


      it("On T +1 day, registered randomGuy1 can buy REQ Tokens over the cap limit of the first day (2 ethers) because the next day cap double : 4 ether", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 6);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 6);
            return aRequestTokenSaleInstance.buyTokens({
              from: randomGuy1,
              gas: amountGazProvided,
              gasPrice: gasPriceUnderLimit,
              value: web3.toWei(3, "ether")
            });
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
          });
      });


      it("On T + 1 day, registered randomGuy1 can't buy REQ Tokens over the new cap limit of : 4 ether (double of 2 ether first cap)", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 6);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 6);
            return Extensions.expectedExceptionPromise(function() {
                return aRequestTokenSaleInstance.buyTokens({
                  from: randomGuy1,
                  gas: amountGazProvided,
                  gasPrice: gasPriceUnderLimit,
                  value: web3.toWei(5, "ether")
                });
              },
              amountGazProvided);
          });
      });

      it("On T + 2 day, registered randomGuy1 can buy REQ Tokens over the  T+1 limit of : 4 ether. New cap limit is 8 ether at T+2", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 7);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 7);
            return aRequestTokenSaleInstance.buyTokens({
              from: randomGuy1,
              gas: amountGazProvided,
              gasPrice: gasPriceUnderLimit,
              value: web3.toWei(5, "ether")
            });
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
          });
      });

      it("On T + 2 day, registered randomGuy1 can't buy REQ Tokens over the new cap limit is 8 ether", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 7);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 7);
            return Extensions.expectedExceptionPromise(function() {
                return aRequestTokenSaleInstance.buyTokens({
                  from: randomGuy1,
                  gas: amountGazProvided,
                  gasPrice: gasPriceUnderLimit,
                  value: web3.toWei(9, "ether")
                });
              },
              amountGazProvided);
          });
      });

      it("On T + 3 day, registered randomGuy1 can buy REQ Tokens over the  T+2 limit of : 8 ether. New cap limit is 16 ether at T+3", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 8);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 8);
            return aRequestTokenSaleInstance.buyTokens({
              from: randomGuy1,
              gas: amountGazProvided,
              gasPrice: gasPriceUnderLimit,
              value: web3.toWei(9, "ether")
            });
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
          });
      });

      it("On T + 3 day, registered randomGuy1 can't buy REQ Tokens over the new cap limit is 16 ether", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 8);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 8);
            return Extensions.expectedExceptionPromise(function() {
                return aRequestTokenSaleInstance.buyTokens({
                  from: randomGuy1,
                  gas: amountGazProvided,
                  gasPrice: gasPriceUnderLimit,
                  value: web3.toWei(17, "ether")
                });
              },
              amountGazProvided);
          });
      });

      it("Afer crowdsale ended T + 4, registered randomGuy1 can't buy REQ Tokens anymore", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        //  5 days = the crowdsale day + 4 days +1 sec =>  crowdsale ended
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise((dayInsecond * 9) + 1);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + (dayInsecond * 9) + 1);
            return Extensions.expectedExceptionPromise(function() {
                return aRequestTokenSaleInstance.buyTokens({
                  from: randomGuy1,
                  gas: amountGazProvided,
                  gasPrice: gasPriceUnderLimit,
                  value: web3.toWei(1, "ether")
                });
              },
              amountGazProvided);
          });
      });
    });

    describe("test hard cap limitation (20 ethers for test)", function() {
      var aRequestTokenSaleInstance;
      var aRequestTokenInstance;
      beforeEach("create a new RequestTokenSale contract instance", function() {
        currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
        startTimeSolidity = currentTimeStamp + 5 * dayInsecond;
        endTimeSolidity = startTimeSolidity + 4 * dayInsecond;
        return RequestTokenSale.new(startTimeSolidity, endTimeSolidity, {
            from: admin
          })
          .then(instance => {
            aRequestTokenSaleInstance = instance;
            return aRequestTokenSaleInstance.token.call()
          }).
        then(instance => {
            aRequestTokenInstance = RequestToken.at(instance);
            return aRequestTokenSaleInstance.changeRegistrationStatus(randomGuy1, true, {
              from: admin,
              gas: amountGazProvided
            });
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
            return aRequestTokenSaleInstance.changeRegistrationStatus(randomGuy2, true, {
              from: admin,
              gas: amountGazProvided
            });
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
            return aRequestTokenSaleInstance.setBaseEthCapPerAddress(web3.toWei(11, "ether"), {
              from: admin,
              gas: amountGazProvided
            });
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
            return aRequestTokenSaleInstance.baseEthCapPerAddress.call();
          }).then(baseEthCapPerAddress => assert.strictEqual(baseEthCapPerAddress.toString(10), web3.toWei(11, "ether").toString(10), "baseEthCapPerAddress"));
      });

      it("Test hard cap limitation 20 ethers. randomGuy1 send 11 ethers and randomGuy2 try to send 11 ethers but rejected because of hard cap 20 ethers ", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        // simulate wait of 5 of 5 days = the crowdsale day
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 5);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 5);
            return aRequestTokenSaleInstance.buyTokens({
              from: randomGuy1,
              gas: amountGazProvided,
              gasPrice: gasPriceUnderLimit,
              value: web3.toWei(11, "ether")
            });
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
            return Extensions.expectedExceptionPromise(function() {
                return aRequestTokenSaleInstance.buyTokens({
                  from: randomGuy2,
                  gas: amountGazProvided,
                  gasPrice: gasPriceUnderLimit,
                  value: web3.toWei(11, "ether")
                });
              },
              amountGazProvided);
          });
      });
    });


    describe("test drainRemainingToken function", function() {
      var aRequestTokenSaleInstance;
      var aRequestTokenInstance;
      beforeEach("create a new RequestTokenSale contract instance", function() {
        currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
        startTimeSolidity = currentTimeStamp + 5 * dayInsecond;
        endTimeSolidity = startTimeSolidity + 4 * dayInsecond;
        return RequestTokenSale.new(startTimeSolidity, endTimeSolidity, {
            from: admin
          })
          .then(instance => {
            aRequestTokenSaleInstance = instance;
            return aRequestTokenSaleInstance.token.call()
          }).
        then(instance => {
            aRequestTokenInstance = RequestToken.at(instance);
            return aRequestTokenSaleInstance.changeRegistrationStatus(randomGuy1, true, {
              from: admin,
              gas: amountGazProvided
            });
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
            return aRequestTokenSaleInstance.changeRegistrationStatus(randomGuy2, true, {
              from: admin,
              gas: amountGazProvided
            });
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
            return aRequestTokenSaleInstance.setBaseEthCapPerAddress(web3.toWei(11, "ether"), {
              from: admin,
              gas: amountGazProvided
            });
          })
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
            return aRequestTokenSaleInstance.baseEthCapPerAddress.call();
          }).then(baseEthCapPerAddress => assert.strictEqual(baseEthCapPerAddress.toString(10), web3.toWei(11, "ether").toString(10), "baseEthCapPerAddress"));
      });

      it("drainRemainingToken test ", function() {
        if (!isTestRPC) this.skip("This test is only for testrpc");
        let increaseBefore;
        // simulate wait of 5 of 5 days = the crowdsale day
        return web3.evm.increaseTimePromise(0)
          .then(_increaseBefore => {
            increaseBefore = _increaseBefore;
            return web3.evm.increaseTimePromise(dayInsecond * 5);
          })
          .then(increase => {
            assert.strictEqual(increase, increaseBefore + dayInsecond * 5);
            return aRequestTokenInstance.balanceOf.call(foundationWallet);
          })
          .then(balance => {
            assert.strictEqual(balance.toString(10), "150000000" + decimals18, "foundationWallet inital amount");
            //can't drain before the end of the crowdsale
            return Extensions.expectedExceptionPromise(function() {
                return aRequestTokenSaleInstance.drainRemainingToken({
                  from: admin,
                  gas: amountGazProvided
                });
              },
              amountGazProvided);
          })
          .then(() => web3.evm.increaseTimePromise(dayInsecond * 4)) //  T+4 crowdsale ended
          .then(() => {
            //randomGuy1 can't drainRemainingToken
            return Extensions.expectedExceptionPromise(function() {
                return aRequestTokenSaleInstance.drainRemainingToken({
                  from: randomGuy1,
                  gas: amountGazProvided
                });
              },
              amountGazProvided);
          })
          .then(() => aRequestTokenSaleInstance.drainRemainingToken({
            from: admin,
            gas: amountGazProvided
          }))
          .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
            return aRequestTokenInstance.balanceOf.call(foundationWallet);
          })
          .then(balance => {
            //150000000 (initial fondation allocation)  + 500000000 (crowdsale) => 650000000 REQ in the end
            assert.strictEqual(balance.toString(10), "650000000" + decimals18, "foundationWallet inital amount");
            return aRequestTokenSaleInstance.weiRaised.call();
          }).then(balance => {
            assert.strictEqual(balance.toString(10), "0", "weiRaised 0 ");
          });
      });
    })
  });

})
