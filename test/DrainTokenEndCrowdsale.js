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


contract('Drain remaining token after sale', function(accounts) {
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
		const endTimeSolidity 	= startTimeSolidity + 3*dayInSecond;

		// create de crowdsale
		requestTokenSale = await RequestTokenSale.new(startTimeSolidity, endTimeSolidity);
		// retrieve the Token itself
		requestToken = await RequestToken.at(await requestTokenSale.token.call());


		var baseCapPerAddressWei = web3.toWei(10, "ether");
		await requestTokenSale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:admin});
		await requestTokenSale.changeRegistrationStatuses([randomGuy1,randomGuy2,randomGuy3], true, {from:admin});

	});

	it("drain token ", async function() {
		var weiSpend = web3.toWei(10, "ether");

		// cannot drain before the sale
		await expectThrow(requestTokenSale.drainRemainingToken({from:admin}));
		addsDayOnEVM(2);

		await requestTokenSale.sendTransaction({from:randomGuy1,value:weiSpend, gasPrice:gasPriceMax});
		await requestTokenSale.sendTransaction({from:randomGuy2,value:weiSpend, gasPrice:gasPriceMax});
		await requestTokenSale.sendTransaction({from:randomGuy3,value:weiSpend, gasPrice:gasPriceMax});

		// cannot drain during the sale
		await expectThrow(requestTokenSale.drainRemainingToken({from:admin}));

		addsDayOnEVM(3);

		// can drain after the sale
		var tokenRemainingBeforeDrain = await requestToken.balanceOf(requestTokenSale.address);
		var r = await requestTokenSale.drainRemainingToken({from:admin})
		assert((new BigNumber(0)).equals(await requestToken.balanceOf(requestTokenSale.address)), "requestTokenSale.address balance");
		assert((new BigNumber(10).pow(18)).mul(REQUEST_FOUNDATION_AMOUNT).plus(tokenRemainingBeforeDrain).equals(await requestToken.balanceOf(foundationWallet)), "foundationWallet balance");
	});



	var addsDayOnEVM = async function(days) {
		var daysInsecond = 60 * 60 * 24 * days 
		var currentBlockTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [daysInsecond], id: 0});
		await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0});
	}


});


