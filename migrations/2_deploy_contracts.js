// var ConvertLib = artifacts.require("./ConvertLib.sol");
var RequestTokenSale = artifacts.require("./RequestTokenSale.sol");


module.exports = function(deployer) {
	const minute = 60*1000;

	// const startTimeTimestampJS = new Date("2017-10-13").getTime();
	// const endTimeTimestampJS = new Date("2017-10-17").getTime();
	const startTimeTimestampJS = Date.now();
	const endTimeTimestampJS = startTimeTimestampJS + 15*minute;

		// translate date in Second for solidity
	const startTimeSolidity = Math.floor(startTimeTimestampJS/1000);
	const endTimeSolidity = Math.floor(endTimeTimestampJS/1000);

	const admin = "0xacCDd9BAc6FDD4E730F183b9E450a0eC6fD8e3c7"; // rinkeby1
	const VestingRinkeby = "0x46786683035B1F56Eb9a7D65e3ea67Ce5B31B272"; // Vesting Rinkeby
	const EarlyInvestRinkeby = "0xb80438e752527fa4b3d890a4192f8000025c79f9"; // Early Invest Rinkeby
	const FoundationRinkeby = "0x53505D5D4349DE20Bb92aCD3BA1D8c6F7d79cFc6"; // Foundation Rinkeby

	console.log( "#################################################################################");
	console.log( "startTimeSolidity : "+startTimeSolidity);
	console.log( "endTimeSolidity : "+endTimeSolidity);
	console.log( "admin : "+admin);
	console.log( "VestingRinkeby : "+VestingRinkeby);
	console.log( "EarlyInvestRinkeby : "+EarlyInvestRinkeby);
	console.log( "FoundationRinkeby : "+FoundationRinkeby);
	console.log( "#################################################################################");

  // deployer.deploy(ConvertLib);
  // deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(RequestTokenSale, startTimeSolidity, endTimeSolidity, {from:admin,gas:6100000});
};


// personal.unlockAccount(personal.listAccounts[0]);
// geth --rinkeby console --rpc