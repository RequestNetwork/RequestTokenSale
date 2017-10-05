pragma solidity 0.4.15;

import "./base/crowdsale/CappedCrowdsale.sol";
import "./WhitelistedCrowdsale.sol";
import "./ProgressiveIndividualCappedCrowdsale.sol";
import "./base/token/StandardToken.sol";
import "./RequestToken.sol";

/**
 * @title RequestTokenSale
 * @dev 
 * We add new features to a base crowdsale using multiple inheritance.
 * We are using the following extensions:
 * CappedCrowdsale - sets a max boundary for raised funds
 * WhitelistedCrowdsale - add a whitelist
 * ProgressiveIndividualCappedCrowdsale - add a Progressive individual cap
 *
 * The code is based on the contracts of Open Zeppelin and we add our contracts : RequestTokenSale, WhiteListedCrowdsale, ProgressiveIndividualCappedCrowdsale and the Request Token
 */
contract RequestTokenSale is Ownable, CappedCrowdsale, WhitelistedCrowdsale, ProgressiveIndividualCappedCrowdsale {
    // hard cap of the token sale in ether
    uint private constant HARD_CAP_IN_WEI = 100000 ether;

    // Total of Request Token supply
    uint public constant TOTAL_REQUEST_TOKEN_SUPPLY = 1000000000;

    // Token sale rate from ETH to REQ
    uint private constant RATE_ETH_REQ = 5000;
    
    // Token initialy distributed for the team (15%)
    address public constant TEAM_VESTING_WALLET = 0xa76bc39ae4b88ef203c6afe3fd219549d86d12f2;
    uint public constant TEAM_VESTING_AMOUNT = 150000000e18;

    // Token initialy distributed for the early investor (20%)
    address public constant EARLY_INVESTOR_WALLET = 0xa579e31b930796e3df50a56829cf82db98b6f4b3;
    uint public constant EARLY_INVESTOR_AMOUNT = 200000000e18;

    // Token initialy distributed for the early foundation (15%)
    // wallet use also to gather the ether of the token sale
    address private constant REQUEST_FOUNDATION_WALLET = 0xdd76b55ee6dafe0c7c978bff69206d476a5b9ce7;
    uint public constant REQUEST_FOUNDATION_AMOUNT = 150000000e18;

    // PERIOD WHEN TOKEN IS NOT TRANSFERABLE AFTER THE SALE
    uint public constant PERIOD_AFTERSALE_NOT_TRANSFERABLE_IN_SEC = 3 days;

    function RequestTokenSale(uint256 _startTime, uint256 _endTime)
      ProgressiveIndividualCappedCrowdsale()
      WhitelistedCrowdsale()
      CappedCrowdsale(HARD_CAP_IN_WEI)
      StandardCrowdsale(_startTime, _endTime, RATE_ETH_REQ, REQUEST_FOUNDATION_WALLET)
    {

        token.transfer(TEAM_VESTING_WALLET, TEAM_VESTING_AMOUNT);

        token.transfer(EARLY_INVESTOR_WALLET, EARLY_INVESTOR_AMOUNT);

        token.transfer(REQUEST_FOUNDATION_WALLET, REQUEST_FOUNDATION_AMOUNT);
    }

    // override Crowdsale.createTokenContract to create RequestToken token
    function createTokenContract () 
      internal 
      returns(StandardToken) 
    {
        return new RequestToken(TOTAL_REQUEST_TOKEN_SUPPLY, endTime+PERIOD_AFTERSALE_NOT_TRANSFERABLE_IN_SEC, REQUEST_FOUNDATION_WALLET, EARLY_INVESTOR_WALLET);
    }

    // Transfer the unsold tokens to the request Foundation multisign wallet
    function drainRemainingToken () 
      public
      onlyOwner
    {
        require(hasEnded());
        token.transfer(REQUEST_FOUNDATION_WALLET, token.balanceOf(this));
    }
  
}
  