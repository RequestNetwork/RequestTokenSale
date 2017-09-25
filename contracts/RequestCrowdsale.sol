pragma solidity ^0.4.11;

import "./base/crowdsale/CappedCrowdsale.sol";
import "./base/crowdsale/WhitelistedCrowdsale.sol";
import "./base/crowdsale/ProgressiveIndividualCappedCrowdsale.sol";
import "./base/token/StandardToken.sol";
import "./RequestQuark.sol";

/**
 * @title RequestCrowdsale
 * @dev 
 * We add new features to a base crowdsale using multiple inheritance.
 * We are using the following extensions:
 * CappedCrowdsale - sets a max boundary for raised funds
 * WhitelistedCrowdsale - add a whitelist
 * ProgressiveIndividualCappedCrowdsale - add a Progressive individual cap
 *
 * The code is based on the contracts of Open Zeppelin and we add our contracts : RequestCrowdsale, WhiteListedCrowdsale, ProgressiveIndividualCappedCrowdsale and the Request Token
 */
contract RequestCrowdsale is Ownable, CappedCrowdsale, WhitelistedCrowdsale, ProgressiveIndividualCappedCrowdsale  {

  function RequestCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, uint256 _tokenTotalAmount, uint256 _cap, address[] tokenInitialDistributionAddresses, uint256[] tokenInitialDistributionAmounts)
    ProgressiveIndividualCappedCrowdsale()
    WhitelistedCrowdsale()
    CappedCrowdsale(_cap)
    StandardCrowdsale(_startTime, _endTime, _rate, _wallet, _tokenTotalAmount)
  {
    require(tokenInitialDistributionAddresses.length == tokenInitialDistributionAmounts.length);

    // verify that the cap*rate is equal to the number of tokens owned by the contract.
    require(_cap.mul(_rate) == numberTokenForSale(_tokenTotalAmount,tokenInitialDistributionAmounts));

    for(uint8 i=0; i<tokenInitialDistributionAddresses.length ;i++) {
      token.transfer(tokenInitialDistributionAddresses[i], tokenInitialDistributionAmounts[i]);
    }
  }

  // override Crowdsale.createTokenContract to create RequestQuark token
  function createTokenContract(uint _tokenTotalAmount, address _admin) 
    internal 
    returns(StandardToken) 
  {
    return new RequestQuark(_tokenTotalAmount, _admin);
  }

  // INTERNAL : Compute the number of token remaining for Sale - only use in constructor
  function numberTokenForSale(uint256 _totalSupplyToken, uint256[] _tokenInitialDistributionAmounts) 
    internal 
    returns(uint256) 
  {
    uint256 totalForSale = _totalSupplyToken;
    for(uint8 i=0; i<_tokenInitialDistributionAmounts.length ;i++) {
      totalForSale -= _tokenInitialDistributionAmounts[i];
    }
    return totalForSale;
  }

}
  