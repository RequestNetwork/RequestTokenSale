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


contract('Transfer token', function(accounts) {
	// account setting ----------------------------------------------------------------------
	var admin = accounts[0];
	var foundationWallet = accounts[1];
	var earlyInvestorWallet = accounts[2];
	var vestingWallet = accounts[3];

	var randomGuy1 = accounts[4];
	var randomGuy2 = accounts[5];
	var randomGuy3 = accounts[6];
	var randomGuy4 = accounts[7];
	var randomGuy5 = accounts[8];
	var randomGuy6 = accounts[9];

	// tool const ----------------------------------------------------------------------------
	const day = 60 * 60 * 24 * 1000;
	const dayInSecond = 60 * 60 * 24;
	const second = 1000;
	const gasPriceMax = 50000000000;

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

	beforeEach(async () => {
		const currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		const startTimeSolidity = currentTimeStamp + 2*dayInSecond;
		const endTimeSolidity 	= startTimeSolidity + 4*dayInSecond;

		// create de crowdsale
		requestTokenSale = await RequestTokenSale.new(startTimeSolidity, endTimeSolidity);
		// retrieve the Token itself
		requestToken = await RequestToken.at(await requestTokenSale.token.call());

		var baseCapPerAddressWei = web3.toWei(10, "ether");

		await requestTokenSale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:admin});
		await requestTokenSale.changeRegistrationStatus(randomGuy1, true, {from:admin});

	});


	it("Transfer token by random guy", async function() {
		var weiSpend = web3.toWei(10, "ether");
		var tokens10 = new BigNumber(10).pow(18).mul(10);

		// Transfer token by random  before token sale	opcode
		await expectThrow(requestToken.transfer(randomGuy2, tokens10, {from:randomGuy1}));

		addsDayOnEVM(2);
		await requestTokenSale.sendTransaction({from:randomGuy1,value:weiSpend, gasPrice:gasPriceMax});

		// Transfer token by random  during token sale	opcode
		await expectThrow(requestToken.transfer(randomGuy2, tokens10, {from:randomGuy1}));

		addsDayOnEVM(4);
		// Transfer token by random  after token sale within 3days	opcode
		await expectThrow(requestToken.transfer(randomGuy2, tokens10, {from:randomGuy1}));


		addsDayOnEVM(3);
		assert((new BigNumber(10).pow(18)).mul(50000).equals(await requestToken.balanceOf(randomGuy1)), "randomGuy1 balance");
		// Transfer token by random after 3 days after token sale OK
		var r = await requestToken.transfer(randomGuy2, tokens10, {from:randomGuy1});

		assert((new BigNumber(10).pow(18)).mul(50000-10).equals(await requestToken.balanceOf(randomGuy1)), "randomGuy1 balance");
		assert(tokens10.equals(await requestToken.balanceOf(randomGuy2)), "randomGuy2 balance");

	});

	it("Transfer token by foundationWallet", async function() {
		var weiSpend = web3.toWei(10, "ether");
		var tokens10 = new BigNumber(10).pow(18).mul(10);

		// Transfer token by FoundationWallet before token sale OK	
		var r = await requestToken.transfer(randomGuy3, tokens10, {from:foundationWallet});
		assert((new BigNumber(10).pow(18)).mul(REQUEST_FOUNDATION_AMOUNT-10).equals(await requestToken.balanceOf(foundationWallet)), "foundationWallet balance");
		assert(tokens10.equals(await requestToken.balanceOf(randomGuy3)), "randomGuy3 balance");

		addsDayOnEVM(2);
		// Transfer token by FoundationWallet during token sale OK
		var r = await requestToken.transfer(randomGuy4, tokens10, {from:foundationWallet});
		assert((new BigNumber(10).pow(18)).mul(REQUEST_FOUNDATION_AMOUNT-10-10).equals(await requestToken.balanceOf(foundationWallet)), "foundationWallet balance");
		assert(tokens10.equals(await requestToken.balanceOf(randomGuy4)), "randomGuy4 balance")

		addsDayOnEVM(4);
		// Transfer token by FoundationWallet after token sale within 3days OK
		var r = await requestToken.transfer(randomGuy5, tokens10, {from:foundationWallet});
		assert((new BigNumber(10).pow(18)).mul(REQUEST_FOUNDATION_AMOUNT-10-10-10).equals(await requestToken.balanceOf(foundationWallet)), "foundationWallet balance");
		assert(tokens10.equals(await requestToken.balanceOf(randomGuy5)), "randomGuy5 balance")

		addsDayOnEVM(3);
		// Transfer token by FoundationWallet after 3 days after token sale OK
		var r = await requestToken.transfer(randomGuy6, tokens10, {from:foundationWallet});
		assert((new BigNumber(10).pow(18)).mul(REQUEST_FOUNDATION_AMOUNT-10-10-10-10).equals(await requestToken.balanceOf(foundationWallet)), "foundationWallet balance");
		assert(tokens10.equals(await requestToken.balanceOf(randomGuy6)), "randomGuy6 balance")

	});

	
	it("Transfer token by earlyInvestorWallet", async function() {
		var weiSpend = web3.toWei(10, "ether");
		var tokens10 = new BigNumber(10).pow(18).mul(10);

		// Transfer token by earlyInvestorWallet before token sale OK	
		var r = await requestToken.transfer(randomGuy3, tokens10, {from:earlyInvestorWallet});
		assert((new BigNumber(10).pow(18)).mul(EARLY_INVESTOR_AMOUNT-10).equals(await requestToken.balanceOf(earlyInvestorWallet)), "earlyInvestorWallet balance");
		assert(tokens10.equals(await requestToken.balanceOf(randomGuy3)), "randomGuy3 balance");

		addsDayOnEVM(2);
		// Transfer token by earlyInvestorWallet during token sale OK
		var r = await requestToken.transfer(randomGuy4, tokens10, {from:earlyInvestorWallet});
		assert((new BigNumber(10).pow(18)).mul(EARLY_INVESTOR_AMOUNT-10-10).equals(await requestToken.balanceOf(earlyInvestorWallet)), "earlyInvestorWallet balance");
		assert(tokens10.equals(await requestToken.balanceOf(randomGuy4)), "randomGuy4 balance")

		addsDayOnEVM(4);
		// Transfer token by earlyInvestorWallet after token sale within 3days OK
		var r = await requestToken.transfer(randomGuy5, tokens10, {from:earlyInvestorWallet});
		assert((new BigNumber(10).pow(18)).mul(EARLY_INVESTOR_AMOUNT-10-10-10).equals(await requestToken.balanceOf(earlyInvestorWallet)), "earlyInvestorWallet balance");
		assert(tokens10.equals(await requestToken.balanceOf(randomGuy5)), "randomGuy5 balance")

		addsDayOnEVM(3);
		// Transfer token by earlyInvestorWallet after 3 days after token sale OK
		var r = await requestToken.transfer(randomGuy6, tokens10, {from:earlyInvestorWallet});
		assert((new BigNumber(10).pow(18)).mul(EARLY_INVESTOR_AMOUNT-10-10-10-10).equals(await requestToken.balanceOf(earlyInvestorWallet)), "earlyInvestorWallet balance");
		assert(tokens10.equals(await requestToken.balanceOf(randomGuy6)), "randomGuy6 balance")

	});

	var addsDayOnEVM = async function(days) {
		var daysInsecond = 60 * 60 * 24 * days 
		var currentBlockTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [daysInsecond], id: 0});
		await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0});
	}


});


