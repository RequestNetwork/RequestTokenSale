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

	const startTimeTimestampJS = new Date("2017-10-13").getTime();
	const endTimeTimestampJS 	= new Date("2017-10-20").getTime();
		// translate date in Second for solidity
	const startTimeSolidity = Math.floor(startTimeTimestampJS/1000);
	const endTimeSolidity = Math.floor(endTimeTimestampJS/1000);

		// 35% for presale/reserve etc... and 15% for vesting.
	const tokenInitialDistributionAddresses = [ multiSigWallet, vestingWallet ];
	const tokenInitialDistributionAmounts = [ amountTokenSupplySolidity.mul(35).div(100), amountTokenSupplySolidity.mul(15).div(100)  ];

    // variable to host contracts ------------------------------------------------------------
	var requestCrowdsale;
	var requestQuark;

  //   it("Create regular crowdsale", async function() {
  //   	// create de crowdsale
  //   	requestCrowdsale = await RequestCrowdsale.new(startTimeSolidity, endTimeSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWei, tokenInitialDistributionAddresses, tokenInitialDistributionAmounts);
  //   	// retrieve the Token itself
  //   	requestQuark = await RequestQuark.at(await requestCrowdsale.token.call());

  //   	// Crowdsale 
		// assert((await requestCrowdsale.cap.call()).equals(capCrowdsaleInWei), "cap is wrong");
		// assert.equal(await requestCrowdsale.rate.call(), rateETHREQ, "rate is wrong");
		// assert.equal(await requestCrowdsale.baseEthCapPerAddress.call(), 0, "baseEthCapPerAddress is wrong");
		// assert.equal(await requestCrowdsale.startTime.call(), startTimeSolidity, "startTime is wrong");
		// assert.equal(await requestCrowdsale.endTime.call(), endTimeSolidity, "endTime is wrong");
		// assert.equal(await requestCrowdsale.wallet.call(), multiSigWallet, "wallet is wrong");
		// assert.equal(await requestCrowdsale.weiRaised.call(), 0, "weiRaised is wrong");
		// assert.equal(await requestCrowdsale.owner.call(), admin, "owner is wrong");

		// // Token
		// assert.equal(await requestQuark.name.call(), name, "name is wrong");
		// assert.equal(await requestQuark.symbol.call(), symbol, "symbol is wrong");
		// assert.equal(await requestQuark.decimals.call(), decimals, "decimals is wrong");
		// assert.equal(await requestQuark.owner.call(), multiSigWallet, "owner is wrong");

		// assert((await requestQuark.totalSupply.call()).equals(amountTokenSupplySolidity), "totalSupply is wrong");
		// assert((new BigNumber(10).pow(18)).mul(500000000).equals(await requestQuark.balanceOf(requestCrowdsale.address)), "requestCrowdsale.address balance");
		// assert((new BigNumber(10).pow(18)).mul(350000000).equals(await requestQuark.balanceOf(multiSigWallet)), "multiSigWallet balance");
		// assert((new BigNumber(10).pow(18)).mul(150000000).equals(await requestQuark.balanceOf(vestingWallet)), "vestingWallet balance");
  //   });


  //   it("Create crowdsale with wrong parameters", async function() {
		// // startTime before now	opcode
		// const startTimeBeforeNow = new Date("2016-10-13").getTime();
		// const startTimeBeforeNowSolidity = Math.floor(startTimeBeforeNow/1000);
  //   	await expectThrow(RequestCrowdsale.new(startTimeBeforeNowSolidity, endTimeSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWei, tokenInitialDistributionAddresses, tokenInitialDistributionAmounts));

		// // endTime before startTime	opcode
		// const endBeforeStart = new Date("2017-10-11").getTime();
		// const endBeforeStartSolidity = Math.floor(endBeforeStart/1000);
		// await expectThrow(RequestCrowdsale.new(startTimeSolidity, endBeforeStartSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWei, tokenInitialDistributionAddresses, tokenInitialDistributionAmounts));

  //   	// cap*rate != totalToken – tokenReserved	opcode
		// const capCrowdsaleInWeiWrong = web3.toWei(99999, "ether");
		// await expectThrow(RequestCrowdsale.new(startTimeSolidity, endTimeSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWeiWrong, tokenInitialDistributionAddresses, tokenInitialDistributionAmounts));
		// const tokenInitialDistributionAmountsWrong = [ amountTokenSupplySolidity.mul(36).div(100), amountTokenSupplySolidity.mul(15).div(100)  ];
		// await expectThrow(RequestCrowdsale.new(startTimeSolidity, endTimeSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWei, tokenInitialDistributionAddresses, tokenInitialDistributionAmountsWrong));

		// // size tokenBeforeSaleAddress!= size tokenBeforeSaleAmount	opcode
		// const tokenInitialDistributionAddressesWrongSize = [ multiSigWallet, vestingWallet, admin  ];
		// await expectThrow(RequestCrowdsale.new(startTimeSolidity, endTimeSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWei, tokenInitialDistributionAddressesWrongSize, tokenInitialDistributionAmounts));


		// // t vesting + t multi + t sell != t total supply	opcode
		// const capCrowdsaleInWeiWrong0 = web3.toWei(0, "ether");
		// const tokenInitialDistributionAmountsWrong101percent = [ amountTokenSupplySolidity.mul(100).div(100), amountTokenSupplySolidity.mul(1).div(100)  ];
		// await expectThrow(RequestCrowdsale.new(startTimeSolidity, endTimeSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWeiWrong0, tokenInitialDistributionAddresses, tokenInitialDistributionAmountsWrong101percent));

  //   });

	
    it("Modify individual base cap 2days before", async function() {

			const startTimeIn2days = Date.now() + 2*day;
			const endTimeStartPlus7days = startTimeIn2days + 7*day;
				// translate date in Second for solidity
			const startTimeIn2daysSolidity = Math.floor(startTimeIn2days/1000);
			const endTimeStartPlus7daysSolidity = Math.floor(endTimeStartPlus7days/1000);

    	// create de crowdsale
    	requestCrowdsale = await RequestCrowdsale.new(startTimeIn2daysSolidity, endTimeStartPlus7daysSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWei, tokenInitialDistributionAddresses, tokenInitialDistributionAmounts);
    	// retrieve the Token itself
    	requestQuark = await RequestQuark.at(await requestCrowdsale.token.call());

			var baseCapPerAddressWei = web3.toWei(10, "ether");

				// Update ind base cap by admin	
				// Update ind base cap 2days before sale start
			await requestCrowdsale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:admin});
			assert((await requestCrowdsale.baseEthCapPerAddress.call()).equals(baseCapPerAddressWei), "baseEthCapPerAddress is wrong");

			// Update ind base cap by random guy opcode	
			await expectThrow(requestCrowdsale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:randomGuy1}));
			// Update ind base cap by multisig opcode
			await expectThrow(requestCrowdsale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:multiSigWallet}));
			// Update ind base cap by vesting opcode
			await expectThrow(requestCrowdsale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:vestingWallet}));

			// Update ind base cap to 0
			await requestCrowdsale.setBaseEthCapPerAddress(web3.toWei(0, "ether"),{from:admin});
			assert.equal(await requestCrowdsale.baseEthCapPerAddress.call(), 0, "baseEthCapPerAddress is wrong");

    });

    it("Modify individual base cap less than 1day before", async function() {
			const startTimeIn1days = Date.now() + 1*day;
			const endTimeStartPlus7days = startTimeIn1days + 7*day;
				// translate date in Second for solidity
			const startTimeIn2daysSolidity = Math.floor(startTimeIn1days/1000);
			const endTimeStartPlus7daysSolidity = Math.floor(endTimeStartPlus7days/1000);

    	// create de crowdsale
    	requestCrowdsale = await RequestCrowdsale.new(startTimeIn2daysSolidity, endTimeStartPlus7daysSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWei, tokenInitialDistributionAddresses, tokenInitialDistributionAmounts);
    	// retrieve the Token itself
    	requestQuark = await RequestQuark.at(await requestCrowdsale.token.call());

			var baseCapPerAddressWei = web3.toWei(10, "ether");

				// Update ind base cap less than 24h before sale start	opcode
			await expectThrow(requestCrowdsale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:admin}));

			// TODO Update ind base cap after sale started => opcode
    });

});


