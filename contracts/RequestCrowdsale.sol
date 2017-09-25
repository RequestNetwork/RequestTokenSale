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

  // hard cap of the token sale in ether
  uint public constant HARD_CAP_IN_ETHER = 100000;

  // Total of Request Token supply
  uint public constant TOTAL_REQUEST_TOKEN_SUPPLY = 1000000000;

  // Token sale rate from ETH to REQ
  uint public constant RATE_ETH_REQ = 5000;

  // Token initialy distributed for the team (15%)
  address public constant TEAM_VESTING_WALLET = 0x0000000000000000;
  address public constant TEAM_VESTING_AMOUNT = 150000000;

  // Token initialy distributed for the early investor (20%)
  address public constant EARLY_INVESTOR_WALLET = 0x0000000000000000;
  address public constant EARLY_INVESTOR_AMOUNT = 200000000;

  // Token initialy distributed for the early foundation (15%)
  // wallet use also to gather the ether of the token sale
  address public constant REQUEST_FOUNDATION_WALLET = 0x0000000000000000;
  address public constant REQUEST_FOUNDATION_AMOUNT = 150000000;

  function RequestCrowdsale(uint256 _startTime, uint256 _endTime)
    ProgressiveIndividualCappedCrowdsale()
    WhitelistedCrowdsale()
    CappedCrowdsale(HARD_CAP_IN_ETHER)
    StandardCrowdsale(_startTime, _endTime, RATE_ETH_REQ, REQUEST_FOUNDATION_WALLET, TOTAL_REQUEST_TOKEN_SUPPLY)
  {
    // nothing to do here
  }

  // override Crowdsale.createTokenContract to create RequestQuark token
  function createTokenContract(uint _tokenTotalAmount, address _admin) 
    internal 
    returns(StandardToken) 
  {
    return new RequestQuark(_tokenTotalAmount, _admin);
  }
}
  