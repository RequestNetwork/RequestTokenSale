pragma solidity ^0.4.11;

import "./base/crowdsale/CappedCrowdsale.sol";
import "./base/crowdsale/WhitelistedCrowdsale.sol";
import "./base/crowdsale/ProgessiveIndividualCappedCrowdsale.sol";
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
contract RequestCrowdsale is Ownable, CappedCrowdsale, WhitelistedCrowdsale, ProgessiveIndividualCappedCrowdsale  {

  function RequestCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, uint256 _tokenTotalAmount, address[] tokenBeforeSaleAddress, uint256[] tokenBeforeSaleAmount)
    ProgessiveIndividualCappedCrowdsale()
    WhitelistedCrowdsale()
    CappedCrowdsale(numberTokenForSale(_tokenTotalAmount,tokenBeforeSaleAmount).div(_rate))
    StandardCrowdsale(_startTime, _endTime, _rate, _wallet, _tokenTotalAmount)
  {
    // send the token to specific peoples before the sale
    require(tokenBeforeSaleAddress.length == tokenBeforeSaleAmount.length);
    for(uint8 i=0; i<tokenBeforeSaleAddress.length ;i++) {
      token.transfer(tokenBeforeSaleAddress[i], tokenBeforeSaleAmount[i]);
    }
  }

  // overide Crowdsale.createTokenContract to create RequestQuark token
  function createTokenContract(uint _tokenTotalAmount, address _admin) internal returns (StandardToken) {
    return new RequestQuark(_tokenTotalAmount, _admin);
  }

  // INTERNAL : Compute the number of token remaining for Sale - only use in constructor
  function numberTokenForSale(uint256 _totalSupplyToken, uint256[] _tokenBeforeSaleAmount) internal returns(uint256) {
    uint256 totalForSale = _totalSupplyToken;
    for(uint8 i=0; i<_tokenBeforeSaleAmount.length ;i++) {
      totalForSale -= _tokenBeforeSaleAmount[i];
    }
    return totalForSale;
  }

}
  