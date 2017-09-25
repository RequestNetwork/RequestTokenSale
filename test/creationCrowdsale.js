
var RequestTokenSale = artifacts.require("./RequestTokenSale.sol");
var RequestToken = artifacts.require("./RequestToken.sol");
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


contract('Creation Token Sale', function(accounts) {
	// account setting ----------------------------------------------------------------------
	var admin = accounts[0];
	var multiSigWallet = accounts[1];
	var vestingWallet = accounts[2];

	var randomGuy1 = accounts[3];
	// tool const ----------------------------------------------------------------------------
	const day = 60 * 60 * 24 * 1000;
	const dayInsecond = 60 * 60 * 24;
	const second = 1000;

	// crowdsale setting ---------------------------------------------------------------------
	const name = "Request Token";
	const symbol = "REQ";
	const decimals = 18;
	const amountTokenSupply = 1000000000;
	const rateETHREQ = 5000;
		// translate with decimal for solitidy
	const amountTokenSupplySolidity = (new BigNumber(10).pow(decimals)).mul(amountTokenSupply);
	const capCrowdsaleInETH = 100000;
		// setting in wei for solidity
	const capCrowdsaleInWei = web3.toWei(capCrowdsaleInETH, "ether");

	// const startTimeTimestampJS = new Date("2017-10-13").getTime();
	// const endTimeTimestampJS 	= new Date("2017-10-17").getTime();
	// 	// translate date in Second for solidity
	// const startTimeSolidity = Math.floor(startTimeTimestampJS/1000);
	// const endTimeSolidity = Math.floor(endTimeTimestampJS/1000);
	var currentTimeStamp;
	var startTimeSolidity;
	var endTimeSolidity;

		// 35% for presale/reserve etc... and 15% for vesting.
	const tokenInitialDistributionAddresses = [ multiSigWallet, vestingWallet ];
	const tokenInitialDistributionAmounts = [ amountTokenSupplySolidity.mul(35).div(100), amountTokenSupplySolidity.mul(15).div(100)  ];

    // variable to host contracts ------------------------------------------------------------
	var requestTokenSale;
	var requestToken;

	it("Create regular crowdsale", async function() {
		currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		startTimeSolidity = currentTimeStamp + 2*dayInsecond;
		endTimeSolidity = startTimeSolidity + 3*dayInsecond;

		// create de crowdsale
		requestTokenSale = await RequestTokenSale.new(startTimeSolidity, endTimeSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWei, tokenInitialDistributionAddresses, tokenInitialDistributionAmounts);
		// retrieve the Token itself
		requestToken = await RequestToken.at(await requestTokenSale.token.call());

		// Crowdsale 
		assert((await requestTokenSale.cap.call()).equals(capCrowdsaleInWei), "cap is wrong");
		assert.equal(await requestTokenSale.rate.call(), rateETHREQ, "rate is wrong");
		assert.equal(await requestTokenSale.baseEthCapPerAddress.call(), 0, "baseEthCapPerAddress is wrong");
		assert.equal(await requestTokenSale.startTime.call(), startTimeSolidity, "startTime is wrong");
		assert.equal(await requestTokenSale.endTime.call(), endTimeSolidity, "endTime is wrong");
		assert.equal(await requestTokenSale.wallet.call(), multiSigWallet, "wallet is wrong");
		assert.equal(await requestTokenSale.weiRaised.call(), 0, "weiRaised is wrong");
		assert.equal(await requestTokenSale.owner.call(), admin, "owner is wrong");

		// Token
		assert.equal(await requestToken.name.call(), name, "name is wrong");
		assert.equal(await requestToken.symbol.call(), symbol, "symbol is wrong");
		assert.equal(await requestToken.decimals.call(), decimals, "decimals is wrong");
		assert.equal(await requestToken.owner.call(), multiSigWallet, "owner is wrong");

		assert((await requestToken.totalSupply.call()).equals(amountTokenSupplySolidity), "totalSupply is wrong");
		assert((new BigNumber(10).pow(18)).mul(500000000).equals(await requestToken.balanceOf(requestTokenSale.address)), "requestTokenSale.address balance");
		assert((new BigNumber(10).pow(18)).mul(350000000).equals(await requestToken.balanceOf(multiSigWallet)), "multiSigWallet balance");
		assert((new BigNumber(10).pow(18)).mul(150000000).equals(await requestToken.balanceOf(vestingWallet)), "vestingWallet balance");
	});


	it("Create crowdsale with wrong parameters", async function() {

		// startTime before now	opcode
		const startTimeBeforeNow = new Date("2016-10-13").getTime();
		const startTimeBeforeNowSolidity = Math.floor(startTimeBeforeNow/1000);
		await expectThrow(RequestTokenSale.new(startTimeBeforeNowSolidity, endTimeSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWei, tokenInitialDistributionAddresses, tokenInitialDistributionAmounts));

		// endTime before startTime	opcode
		const endBeforeStart = new Date("2017-10-11").getTime();
		const endBeforeStartSolidity = Math.floor(endBeforeStart/1000);
		await expectThrow(RequestTokenSale.new(startTimeSolidity, endBeforeStartSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWei, tokenInitialDistributionAddresses, tokenInitialDistributionAmounts));

		// cap*rate != totalToken – tokenReserved	opcode
		const capCrowdsaleInWeiWrong = web3.toWei(99999, "ether");
		await expectThrow(RequestTokenSale.new(startTimeSolidity, endTimeSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWeiWrong, tokenInitialDistributionAddresses, tokenInitialDistributionAmounts));
		const tokenInitialDistributionAmountsWrong = [ amountTokenSupplySolidity.mul(36).div(100), amountTokenSupplySolidity.mul(15).div(100)  ];
		await expectThrow(RequestTokenSale.new(startTimeSolidity, endTimeSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWei, tokenInitialDistributionAddresses, tokenInitialDistributionAmountsWrong));

		// size tokenBeforeSaleAddress!= size tokenBeforeSaleAmount	opcode
		const tokenInitialDistributionAddressesWrongSize = [ multiSigWallet, vestingWallet, admin  ];
		await expectThrow(RequestTokenSale.new(startTimeSolidity, endTimeSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWei, tokenInitialDistributionAddressesWrongSize, tokenInitialDistributionAmounts));


		// t vesting + t multi + t sell != t total supply	opcode
		const capCrowdsaleInWeiWrong0 = web3.toWei(0, "ether");
		const tokenInitialDistributionAmountsWrong101percent = [ amountTokenSupplySolidity.mul(100).div(100), amountTokenSupplySolidity.mul(1).div(100)  ];
		await expectThrow(RequestTokenSale.new(startTimeSolidity, endTimeSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWeiWrong0, tokenInitialDistributionAddresses, tokenInitialDistributionAmountsWrong101percent));

	});


	it("Modify individual base cap 2days before", async function() {
		const currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		const startTimeIn2daysSolidity = currentTimeStamp + 2*dayInsecond;
		const endTimeStartPlus3daysSolidity = startTimeIn2daysSolidity + 3*dayInsecond;

		// create de crowdsale
		requestTokenSale = await RequestTokenSale.new(startTimeIn2daysSolidity, endTimeStartPlus3daysSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWei, tokenInitialDistributionAddresses, tokenInitialDistributionAmounts);
		// retrieve the Token itself
		requestToken = await RequestToken.at(await requestTokenSale.token.call());

		var baseCapPerAddressWei = web3.toWei(10, "ether");

			// Update ind base cap by admin	
			// Update ind base cap 2days before sale start
		await requestTokenSale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:admin});
		assert((await requestTokenSale.baseEthCapPerAddress.call()).equals(baseCapPerAddressWei), "baseEthCapPerAddress is wrong");

		// Update ind base cap by random guy opcode	
		await expectThrow(requestTokenSale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:randomGuy1}));
		// Update ind base cap by multisig opcode
		await expectThrow(requestTokenSale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:multiSigWallet}));
		// Update ind base cap by vesting opcode
		await expectThrow(requestTokenSale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:vestingWallet}));

		// Update ind base cap to 0
		await requestTokenSale.setBaseEthCapPerAddress(web3.toWei(0, "ether"),{from:admin});
		assert.equal(await requestTokenSale.baseEthCapPerAddress.call(), 0, "baseEthCapPerAddress is wrong");
	});

	it("Modify individual base cap less than 1day before", async function() {
		const currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		const startTimeIn2daysSolidity = currentTimeStamp + 2*dayInsecond;
		const endTimeStartPlus3daysSolidity = startTimeIn2daysSolidity + 3*dayInsecond;

		// create de crowdsale
		requestTokenSale = await RequestTokenSale.new(startTimeIn2daysSolidity, endTimeStartPlus3daysSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWei, tokenInitialDistributionAddresses, tokenInitialDistributionAmounts);
		// retrieve the Token itself
		requestToken = await RequestToken.at(await requestTokenSale.token.call());

		var baseCapPerAddressWei = web3.toWei(10, "ether");

		addsDayOnEVM(1);

			// Update ind base cap less than 24h before sale start	opcode
		await expectThrow(requestTokenSale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:admin}));
	});

	it("Update ind base cap after sale started => opcode", async function() {
		const currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		const startTimeIn2daysSolidity = currentTimeStamp + 1*dayInsecond;
		const endTimeStartPlus3daysSolidity = startTimeIn2daysSolidity + 3*dayInsecond;

		// create de crowdsale
		requestTokenSale = await RequestTokenSale.new(startTimeIn2daysSolidity, endTimeStartPlus3daysSolidity, rateETHREQ, multiSigWallet, amountTokenSupplySolidity, capCrowdsaleInWei, tokenInitialDistributionAddresses, tokenInitialDistributionAmounts);
		// retrieve the Token itself
		requestToken = await RequestToken.at(await requestTokenSale.token.call());

		var baseCapPerAddressWei = web3.toWei(10, "ether");

		addsDayOnEVM(6);

			// Update ind base cap less than 24h before sale start	opcode
		await expectThrow(requestTokenSale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:admin}));
	});


	var addsDayOnEVM = async function(days) {
		var daysInsecond = 60 * 60 * 24 * days 
		var currentBlockTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [daysInsecond], id: 0});
		await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0});
	}

});


