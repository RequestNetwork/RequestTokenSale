
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
	var admin = accounts[0];
	var wallet = accounts[1];

	var guy1 = accounts[2];
	var guy2 = accounts[3];
	var guy3 = accounts[4];
	var guy4 = accounts[5];
	var guy5 = accounts[6];

	var vestingAccount = accounts[7];


	var day = 60 * 60 * 24 * 1000;
	var second = 1000;

	var rate = 2650;
	
	var baseEthCapPerAddress = web3.toWei(7, "ether");
	var totalAmountSupply = (new BigNumber(10).pow(18)).mul(1000000000);
    // var cap; // = web3.toWei(100000, "ether");

	var requestCrowdsale;
	var requestQuark;


    var tokenBeforeSaleAddress = [ wallet, vestingAccount ];
	var tokenBeforeSaleAmount = [ totalAmountSupply.mul(50).div(100), totalAmountSupply.mul(12).div(100)  ];

    beforeEach(async () => {
		var startTime = Date.now(); // + 5*second;
		var endTime = startTime + 2*day;

		startTime = Math.floor(startTime/1000);
		endTime = Math.floor(endTime/1000);

    	requestCrowdsale = await RequestCrowdsale.new(startTime, endTime, rate, wallet, totalAmountSupply, baseEthCapPerAddress, tokenBeforeSaleAddress, tokenBeforeSaleAmount);
    	requestQuark = await RequestQuark.at(await requestCrowdsale.token.call());

    });

    it("Create crowdsale", async function() {
		assert.equal(await requestQuark.balanceOf(guy1), 0, "guy1 must have 0");
		assert((new BigNumber(10).pow(18)).mul(120000000).equals(await requestQuark.balanceOf(vestingAccount)), "vestingAccount balance");
		assert((new BigNumber(10).pow(18)).mul(500000000).equals(await requestQuark.balanceOf(wallet)), "wallet balance");
		assert((new BigNumber(10).pow(18)).mul(380000000).equals(await requestQuark.balanceOf(requestCrowdsale.address)), "requestCrowdsale balance");
    });


	it("Buy token", async function () {
		await requestCrowdsale.updateOneUser(guy1,true);
		
		assert((new BigNumber(0)).equals(await requestQuark.balanceOf(guy1)), "guy1 balance");
		assert((new BigNumber(10).pow(18)).mul(380000000).equals(await requestQuark.balanceOf(requestCrowdsale.address)), "requestCrowdsale balance");
		var walletBalanceEthBefore = await web3.eth.getBalance(wallet);

		var r = await requestCrowdsale.sendTransaction({from:guy1,value:web3.toWei(1, "ether")});

		assert((new BigNumber(10).pow(18)).mul(2650).equals(await requestQuark.balanceOf(guy1)), "guy1 balance");
		assert((new BigNumber(10).pow(18)).mul(380000000).minus((new BigNumber(10).pow(18)).mul(2650)).equals(await requestQuark.balanceOf(requestCrowdsale.address)), "requestCrowdsale balance");
		assert((new BigNumber(walletBalanceEthBefore)).add(web3.toWei(1, "ether")).equals(await web3.eth.getBalance(wallet)), "wallet eth balance");

		await expectThrow(requestCrowdsale.sendTransaction({from:guy1,value:web3.toWei(7, "ether")}));

	});
/*
	it("Add and delete guys to/from whitelist", async function () {
		assert.equal(await requestCrowdsale.whiteList(guy1),false, "guy1 should NOT be on whitelist");
		var r = await requestCrowdsale.updateOneUser(guy1,true);
		assert.equal(r.logs[0].event,"StatusUserUpdatedWhiteList","Event StatusUserUpdatedWhiteList is missing");
		assert.equal(r.logs[0].args.user,guy1,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[0].args.accepted,true,"Event NewTrustedContract wrong args");
		assert.equal(await requestCrowdsale.whiteList(guy1),true, "guy1 should be on whitelist");
		r = await requestCrowdsale.updateOneUser(guy1,false)
		assert.equal(r.logs[0].event,"StatusUserUpdatedWhiteList","Event StatusUserUpdatedWhiteList is missing");
		assert.equal(r.logs[0].args.user,guy1,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[0].args.accepted,false,"Event NewTrustedContract wrong args");
		assert.equal(await requestCrowdsale.whiteList(guy1),false, "guy1 should NOT be on whitelist");

		assert.equal(await requestCrowdsale.whiteList(guy2),false, "guy2 should NOT be on whitelist");
		assert.equal(await requestCrowdsale.whiteList(guy3),false, "guy3 should NOT be on whitelist");
		r = await requestCrowdsale.updateWhiteList([guy2,guy3],[true,true])
		assert.equal(r.logs[0].event,"StatusUserUpdatedWhiteList","Event StatusUserUpdatedWhiteList is missing");
		assert.equal(r.logs[0].args.user,guy2,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[0].args.accepted,true,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[1].event,"StatusUserUpdatedWhiteList","Event StatusUserUpdatedWhiteList is missing");
		assert.equal(r.logs[1].args.user,guy3,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[1].args.accepted,true,"Event NewTrustedContract wrong args");
		assert.equal(await requestCrowdsale.whiteList(guy2),true, "guy2 should be on whitelist");
		assert.equal(await requestCrowdsale.whiteList(guy3),true, "guy3 should be on whitelist");
		r = await requestCrowdsale.updateWhiteList([guy2,guy3],[false,false])
		assert.equal(r.logs[0].event,"StatusUserUpdatedWhiteList","Event StatusUserUpdatedWhiteList is missing");
		assert.equal(r.logs[0].args.user,guy2,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[0].args.accepted,false,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[1].event,"StatusUserUpdatedWhiteList","Event StatusUserUpdatedWhiteList is missing");
		assert.equal(r.logs[1].args.user,guy3,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[1].args.accepted,false,"Event NewTrustedContract wrong args");
		assert.equal(await requestCrowdsale.whiteList(guy2),false, "guy2 should NOT be on whitelist");
		assert.equal(await requestCrowdsale.whiteList(guy3),false, "guy3 should NOT be on whitelist");


		assert.equal(await requestCrowdsale.whiteList(guy4),false, "guy2 should NOT be on whitelist");
		assert.equal(await requestCrowdsale.whiteList(guy5),false, "guy3 should NOT be on whitelist");
		r = await requestCrowdsale.updateWhiteList([guy4,guy5],[true,false])
		assert.equal(r.logs[0].event,"StatusUserUpdatedWhiteList","Event StatusUserUpdatedWhiteList is missing");
		assert.equal(r.logs[0].args.user,guy4,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[0].args.accepted,true,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[1].event,"StatusUserUpdatedWhiteList","Event StatusUserUpdatedWhiteList is missing");
		assert.equal(r.logs[1].args.user,guy5,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[1].args.accepted,false,"Event NewTrustedContract wrong args");
		assert.equal(await requestCrowdsale.whiteList(guy4),true, "guy2 should be on whitelist");
		assert.equal(await requestCrowdsale.whiteList(guy5),false, "guy3 should NOT be on whitelist");
		r = await requestCrowdsale.updateWhiteList([guy4,guy5],[false,true])
		assert.equal(r.logs[0].event,"StatusUserUpdatedWhiteList","Event StatusUserUpdatedWhiteList is missing");
		assert.equal(r.logs[0].args.user,guy4,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[0].args.accepted,false,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[1].event,"StatusUserUpdatedWhiteList","Event StatusUserUpdatedWhiteList is missing");
		assert.equal(r.logs[1].args.user,guy5,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[1].args.accepted,true,"Event NewTrustedContract wrong args");
		assert.equal(await requestCrowdsale.whiteList(guy4),false, "guy4 should NOT be on whitelist");
		assert.equal(await requestCrowdsale.whiteList(guy5),true, "guy5 should be on whitelist");
		r = await requestCrowdsale.updateWhiteList([guy4,guy5],[false,false])
		assert.equal(r.logs[0].event,"StatusUserUpdatedWhiteList","Event StatusUserUpdatedWhiteList is missing");
		assert.equal(r.logs[0].args.user,guy4,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[0].args.accepted,false,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[1].event,"StatusUserUpdatedWhiteList","Event StatusUserUpdatedWhiteList is missing");
		assert.equal(r.logs[1].args.user,guy5,"Event NewTrustedContract wrong args");
		assert.equal(r.logs[1].args.accepted,false,"Event NewTrustedContract wrong args");
		assert.equal(await requestCrowdsale.whiteList(guy4),false, "guy4 should NOT be on whitelist");
		assert.equal(await requestCrowdsale.whiteList(guy5),false, "guy5 should NOT be on whitelist");
	});
*/

});


