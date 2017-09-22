var RequestCrowdsale = artifacts.require("./RequestCrowdsale.sol");
var RequestQuark = artifacts.require("./RequestQuark.sol");
var BigNumber = require('bignumber.js');

var expectThrow = async function(promise) {
  try {
    await promise;
  } catch (error) {
    const invalidOpcode = error.message.search('invalid opcode') >= 0;
    const invalidJump = error.message.search('invalid JUMP') >= 0;
    const outOfGas = error.message.search('out of gas') >= 0;
    assert(
      invalidOpcode || invalidJump || outOfGas,
      "Expected throw, got '" + error + "' instead",
    );
    return;
  }
  assert.fail('Expected throw not received');
};


contract('RequestCore Administrative part', function(accounts) {
	// account setting ----------------------------------------------------------------------
	var admin = accounts[0];
	var multiSigWallet = accounts[1];
	var vestingWallet = accounts[2];

	var randomGuy1 = accounts[3];
	// tool const ----------------------------------------------------------------------------
	const day = 60 * 60 * 24 * 1000;
	const second = 1000;

	// crowdsale setting ---------------------------------------------------------------------
    const name = "Request Quark";
    const symbol = "REQ";
    const decimals = 18;
	const amountTokenSupply = 1000000000;
	const rateETHREQ = 5000;
		// translate with decimal for solitidy
	const amountTokenSupplySolidity = (new BigNumber(10).pow(decimals)).mul(amountTokenSupply);
    const capCrowdsaleInETH = 100000;
    	// setting in wei for solidity
    const capCrowdsaleInWei = web3.toWei(capCrowdsaleInETH, "ether");

    const startTime = new Date("2017-10-13").getTime();
    const endTime 	= new Date("2017-10-20").getTime();
	const startTimeTimestampJS = Date.now();
	const endTimeTimestampJS = startTime + 2*day;
		// translate date in Second for solidity
	const startTimeSolidity = Math.floor(startTimeTimestampJS/1000);
	const endTimeSolidity = Math.floor(endTimeTimestampJS/1000);

    	// 35% for presale/reserve etc... and 15% for vesting.
    const tokenInitialDistributionAddresses = [ multiSigWallet, vestingWallet ];
	const tokenInitialDistributionAmounts = [ amountTokenSupplySolidity.mul(35).div(100), amountTokenSupplySolidity.mul(15).div(100)  ];

    // variable to host contracts ------------------------------------------------------------
	var requestCrowdsale;
	var requestQuark;

    it("Create regular crowdsale", async function() {
    	// create de crowdsale
    	requestCrowdsale = await RequestCrowdsale.new(startTimeSolidity, endTimeSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWei, tokenInitialDistributionAddresses, tokenInitialDistributionAmounts);
    	// retrieve the Token itself
    	requestQuark = await RequestQuark.at(await requestCrowdsale.token.call());

    	// Crowdsale 
		assert((await requestCrowdsale.cap.call()).equals(capCrowdsaleInWei), "cap is wrong");
		assert.equal(await requestCrowdsale.rate.call(), rateETHREQ, "rate is wrong");
		assert.equal(await requestCrowdsale.baseEthCapPerAddress.call(), 0, "baseEthCapPerAddress is wrong");
		assert.equal(await requestCrowdsale.startTime.call(), startTimeSolidity, "startTime is wrong");
		assert.equal(await requestCrowdsale.endTime.call(), endTimeSolidity, "endTime is wrong");
		assert.equal(await requestCrowdsale.wallet.call(), multiSigWallet, "wallet is wrong");
		assert.equal(await requestCrowdsale.weiRaised.call(), 0, "weiRaised is wrong");
		assert.equal(await requestCrowdsale.owner.call(), admin, "owner is wrong");

		// Token
		assert.equal(await requestQuark.name.call(), name, "name is wrong");
		assert.equal(await requestQuark.symbol.call(), symbol, "symbol is wrong");
		assert.equal(await requestQuark.decimals.call(), decimals, "decimals is wrong");
		assert.equal(await requestQuark.owner.call(), multiSigWallet, "owner is wrong");

		assert((await requestQuark.totalSupply.call()).equals(amountTokenSupplySolidity), "totalSupply is wrong");
		assert((new BigNumber(10).pow(18)).mul(500000000).equals(await requestQuark.balanceOf(requestCrowdsale.address)), "requestCrowdsale.address balance");
		assert((new BigNumber(10).pow(18)).mul(350000000).equals(await requestQuark.balanceOf(multiSigWallet)), "multiSigWallet balance");
		assert((new BigNumber(10).pow(18)).mul(150000000).equals(await requestQuark.balanceOf(vestingWallet)), "vestingWallet balance");
    });


	// startTime before now	opcode
	// endTime before startTime	opcode
	// wallet	specified by admin
	// cap*rate != totalToken – tokenReserved	opcode
	// size tokenBeforeSaleAddress!= size tokenBeforeSaleAmount	opcode
	// t vesting + t multi + t sell != t total supply	opcode
		

});


