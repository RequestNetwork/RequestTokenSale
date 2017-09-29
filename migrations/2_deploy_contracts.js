var RequestTokenSale = artifacts.require("./RequestTokenSale.sol");


// Copy & Paste this
Date.prototype.getUnixTime = function() { return this.getTime()/1000|0 };
if(!Date.now) Date.now = function() { return new Date(); }
Date.time = function() { return Date.now().getUnixTime(); }


var tokenSaleContract;

module.exports = function(deployer) {
    var publicSaleStartTime = new Date("Thu, 28 Sep 2017 11:00:00 GMT").getUnixTime();
    var publicSaleEndTime = new Date("Thu, 28 Sep 2017 13:00:00 GMT").getUnixTime();

    // TEST PURPOSE ------------------------------------------------------------
	const minute = 60*1000;
	var startTimeTimestampJS = Date.now() + 30*minute;
	var endTimeTimestampJS = startTimeTimestampJS + 15*minute;
		// translate date in Second for solidity
	publicSaleStartTime = Math.floor(startTimeTimestampJS/1000);
	publicSaleEndTime = Math.floor(endTimeTimestampJS/1000);
	// TEST PURPOSE ------------------------------------------------------------

	console.log( "#################################################################################");
	console.log( "publicSaleStartTime : "+publicSaleStartTime);
	console.log( "publicSaleStartTime : "+new Date(publicSaleStartTime*1000));
	console.log( "publicSaleEndTime : "+publicSaleEndTime);
	console.log( "publicSaleEndTime : "+new Date(publicSaleEndTime*1000));
	console.log( "#################################################################################");
    return RequestTokenSale.new(publicSaleStartTime, publicSaleEndTime).then(function(result){
        tokenSaleContract = result;
        console.log("RequestTokenSale: "+tokenSaleContract.address);
    });
};
