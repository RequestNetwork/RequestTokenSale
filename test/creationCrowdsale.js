return;
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
	var foundationWallet = accounts[1];
	var earlyInvestorWallet = accounts[2];
	var vestingWallet = accounts[3];

	var randomGuy1 = accounts[4];
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

	var currentTimeStamp;
	var startTimeSolidity;
	var endTimeSolidity;

	// Token initialy distributed for the team (15%)
	const TEAM_VESTING_WALLET = vestingWallet;
	const TEAM_VESTING_AMOUNT = 150000000;

	// Token initialy distributed for the early investor (20%)
	const EARLY_INVESTOR_WALLET = earlyInvestorWallet;
	const EARLY_INVESTOR_AMOUNT = 200000000;

	// Token initialy distributed for the early foundation (15%)
	// wallet use also to gather the ether of the token sale
	const REQUEST_FOUNDATION_WALLET = foundationWallet;
	const REQUEST_FOUNDATION_AMOUNT = 150000000;


    // variable to host contracts ------------------------------------------------------------
	var requestTokenSale;
	var requestToken;

	it("Create regular crowdsale", async function() {
		currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		startTimeSolidity = currentTimeStamp + 2*dayInsecond;
		endTimeSolidity = startTimeSolidity + 3*dayInsecond;

		// create de crowdsale
		requestTokenSale = await RequestTokenSale.new(startTimeSolidity, endTimeSolidity);
		// retrieve the Token itself
		requestToken = await RequestToken.at(await requestTokenSale.token.call());

		// Crowdsale 
		assert((await requestTokenSale.cap.call()).equals(capCrowdsaleInWei), "cap is wrong");
		assert.equal(await requestTokenSale.rate.call(), rateETHREQ, "rate is wrong");
		assert.equal(await requestTokenSale.baseEthCapPerAddress.call(), 0, "baseEthCapPerAddress is wrong");
		assert.equal(await requestTokenSale.startTime.call(), startTimeSolidity, "startTime is wrong");
		assert.equal(await requestTokenSale.endTime.call(), endTimeSolidity, "endTime is wrong");
		assert.equal(await requestTokenSale.wallet.call(), foundationWallet, "wallet is wrong");
		assert.equal(await requestTokenSale.weiRaised.call(), 0, "weiRaised is wrong");
		assert.equal(await requestTokenSale.owner.call(), admin, "owner is wrong");

		// Token
		assert.equal(await requestToken.name.call(), name, "name is wrong");
		assert.equal(await requestToken.symbol.call(), symbol, "symbol is wrong");
		assert.equal(await requestToken.decimals.call(), decimals, "decimals is wrong");
		assert.equal(await requestToken.owner.call(), foundationWallet, "owner is wrong");

		assert((await requestToken.totalSupply.call()).equals(amountTokenSupplySolidity), "totalSupply is wrong");
		assert((new BigNumber(10).pow(18)).mul(500000000).equals(await requestToken.balanceOf(requestTokenSale.address)), "requestTokenSale.address balance");
		assert((new BigNumber(10).pow(18)).mul(REQUEST_FOUNDATION_AMOUNT).equals(await requestToken.balanceOf(foundationWallet)), "foundationWallet balance");
		assert((new BigNumber(10).pow(18)).mul(TEAM_VESTING_AMOUNT).equals(await requestToken.balanceOf(vestingWallet)), "vestingWallet balance");
		assert((new BigNumber(10).pow(18)).mul(EARLY_INVESTOR_AMOUNT).equals(await requestToken.balanceOf(earlyInvestorWallet)), "earlyInvestorWallet balance");
	});


	it("Create crowdsale with wrong parameters", async function() {

		// startTime before now	opcode
		const startTimeBeforeNow = new Date("2016-10-13").getTime();
		const startTimeBeforeNowSolidity = Math.floor(startTimeBeforeNow/1000);
		const endTimeSolidity = new Date("2018-10-13").getTime();
		const endTimeSoliditySolidity = Math.floor(endTimeSolidity/1000);
		await expectThrow(RequestTokenSale.new(startTimeBeforeNowSolidity, endTimeSoliditySolidity));

		// endTime before startTime	opcode
		const startTime = new Date("2018-10-11").getTime();
		const startTimeSolidity = Math.floor(startTime/1000);

		const endBeforeStart = new Date("2018-09-11").getTime();
		const endBeforeStartSolidity = Math.floor(endBeforeStart/1000);
		await expectThrow(RequestTokenSale.new(startTimeSolidity, endBeforeStartSolidity));
	});


	it("Modify individual base cap 2days before", async function() {
		const currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		const startTimeIn2daysSolidity = currentTimeStamp + 2*dayInsecond;
		const endTimeStartPlus3daysSolidity = startTimeIn2daysSolidity + 3*dayInsecond;

		// create de crowdsale
		requestTokenSale = await RequestTokenSale.new(startTimeIn2daysSolidity, endTimeStartPlus3daysSolidity);
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
		await expectThrow(requestTokenSale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:foundationWallet}));
		// Update ind base cap by vesting opcode
		await expectThrow(requestTokenSale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:vestingWallet}));

		// Update ind base cap to 0
		await requestTokenSale.setBaseEthCapPerAddress(web3.toWei(0, "ether"),{from:admin});
		assert.equal(await requestTokenSale.baseEthCapPerAddress.call(), 0, "baseEthCapPerAddress is wrong");
	});


});


