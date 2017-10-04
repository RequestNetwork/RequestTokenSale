var RequestTokenSale = artifacts.require("./RequestTokenSale.sol");


// Copy & Paste this
Date.prototype.getUnixTime = function() { return this.getTime()/1000|0 };
if(!Date.now) Date.now = function() { return new Date(); }
Date.time = function() { return Date.now().getUnixTime(); }


var tokenSaleContract;

module.exports = function(deployer) {
    var publicSaleStartTime = new Date("Fri, 13 Oct 2017 07:00:00 GMT").getUnixTime();
    var publicSaleEndTime = new Date("Tue, 17 Oct 2017 07:00:00 GMT").getUnixTime();

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
