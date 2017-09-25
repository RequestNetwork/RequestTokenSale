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


contract('Token Sale Time test', function(accounts) {
	// account setting ----------------------------------------------------------------------
	var admin = accounts[0];
	var foundationWallet = accounts[1];
	var earlyInvestorWallet = accounts[2];
	var vestingWallet = accounts[3];

	var randomGuy1 = accounts[4];
	var randomGuy2 = accounts[5];
	var randomGuy3 = accounts[6];
	var randomGuy4 = accounts[7];
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


	it("Modify individual base cap less than 1day before", async function() {
		var currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		var startTimeIn2daysSolidity = currentTimeStamp + 2*dayInsecond;
		var endTimeStartPlus3daysSolidity = startTimeIn2daysSolidity + 3*dayInsecond;

		// create de crowdsale
		requestTokenSale = await RequestTokenSale.new(startTimeIn2daysSolidity, endTimeStartPlus3daysSolidity);
		// retrieve the Token itself
		requestToken = await RequestToken.at(await requestTokenSale.token.call());

		var baseCapPerAddressWei = web3.toWei(10, "ether");

		addsDayOnEVM(1);

			// Update ind base cap less than 24h before sale start	opcode
		await expectThrow(requestTokenSale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:admin}));
	});

	it("Update ind base cap after sale started => opcode", async function() {
		var currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		var startTimeIn2daysSolidity = currentTimeStamp + 1*dayInsecond;
		var endTimeStartPlus3daysSolidity = startTimeIn2daysSolidity + 3*dayInsecond;

		// create de crowdsale
		requestTokenSale = await RequestTokenSale.new(startTimeIn2daysSolidity, endTimeStartPlus3daysSolidity);
		// retrieve the Token itself
		requestToken = await RequestToken.at(await requestTokenSale.token.call());

		var baseCapPerAddressWei = web3.toWei(10, "ether");

		addsDayOnEVM(6);

			// Update ind base cap less than 24h before sale start	opcode
		await expectThrow(requestTokenSale.setBaseEthCapPerAddress(baseCapPerAddressWei,{from:admin}));
	});

	it("add/delete one guy after sale started", async function() {
		var currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		var startTimeIn1daysSolidity = currentTimeStamp + 1*dayInsecond;
		var endTimeStartPlus3daysSolidity = startTimeIn1daysSolidity + 3*dayInsecond;

		// create de crowdsale
		requestTokenSale = await RequestTokenSale.new(startTimeIn1daysSolidity, endTimeStartPlus3daysSolidity);
		// retrieve the Token itself
		requestToken = await RequestToken.at(await requestTokenSale.token.call());
		addsDayOnEVM(2);
		// add one guy after sale started
		await expectThrow(requestTokenSale.changeRegistrationStatus(randomGuy2, true, {from:admin}));
		// delete one guy after sale started
		await expectThrow(requestTokenSale.changeRegistrationStatus(randomGuy2, false, {from:admin}));
	});
	
	it("add/delete guys after sale started", async function() {
		var currentTimeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		var startTimeIn1daysSolidity = currentTimeStamp + 1*dayInsecond;
		var endTimeStartPlus3daysSolidity = startTimeIn1daysSolidity + 3*dayInsecond;

		// create de crowdsale
		requestTokenSale = await RequestTokenSale.new(startTimeIn1daysSolidity, endTimeStartPlus3daysSolidity);
		// retrieve the Token itself
		requestToken = await RequestToken.at(await requestTokenSale.token.call());
		addsDayOnEVM(2);


		var listAddress = [randomGuy1,randomGuy2];
		// Add 2 guys after sale started
		await expectThrow(requestTokenSale.changeRegistrationStatuses(listAddress, true, {from:admin}));
		// Delete 2 guys after sale started	opcode
		await expectThrow(requestTokenSale.changeRegistrationStatuses(listAddress, false, {from:admin}));
	});

	var addsDayOnEVM = async function(days) {
		var daysInsecond = 60 * 60 * 24 * days 
		var currentBlockTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
		await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [daysInsecond], id: 0});
		await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0});
	}

});


