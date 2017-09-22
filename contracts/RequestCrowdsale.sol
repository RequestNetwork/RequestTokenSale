pragma solidity ^0.4.11;

import "./base/crowdsale/CappedCrowdsale.sol";
import "./base/crowdsale/WhitelistedCrowdsale.sol";
import "./base/crowdsale/ProgressiveIndividualCappedCrowdsale.sol";
import "./base/token/StandardToken.sol";
import "./RequestQuark.sol";

/**
 * @title RequestCrowdsale
 * @dev This is an example of a fully fledged crowdsale.
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * We are providing following extensions:
 * CappedCrowdsale - sets a max boundary for raised funds
 * WhitelistedCrowdsale - add a whiteliste
 * ProgessiveIndividualCappedCrowdsale - add a Progressive individual cap
 *
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 */
contract RequestCrowdsale is Ownable, CappedCrowdsale, WhitelistedCrowdsale, ProgressiveIndividualCappedCrowdsale  {

  function RequestCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, uint256 _tokenTotalAmount, uint256 _cap, address[] tokenInitialDistributionAddresses, uint256[] tokenInitialDistributionAmounts)
    ProgressiveIndividualCappedCrowdsale()
    WhitelistedCrowdsale()
    CappedCrowdsale(_cap)
    StandardCrowdsale(_startTime, _endTime, _rate, _wallet, _tokenTotalAmount)
  {
    // send the token to specific peoples before the sale
    require(tokenInitialDistributionAddresses.length == tokenInitialDistributionAmounts.length);

    // check taht the cap meet the number of token remaining for the sale
    require(_cap.mul(_rate) == numberTokenForSale(_tokenTotalAmount,tokenInitialDistributionAmounts));

    for(uint8 i=0; i<tokenInitialDistributionAddresses.length ;i++) {
      token.transfer(tokenInitialDistributionAddresses[i], tokenInitialDistributionAmounts[i]);
    }
  }

  // overide Crowdsale.createTokenContract to create RequestQuark token
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
  