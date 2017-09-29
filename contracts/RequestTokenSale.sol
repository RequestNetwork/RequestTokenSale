pragma solidity ^0.4.11;

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
    uint public constant HARD_CAP_IN_ETHER = 100000 ether;

    // Total of Request Token supply
    uint public constant TOTAL_REQUEST_TOKEN_SUPPLY = 1000000000;

    // Token sale rate from ETH to REQ
    uint public constant RATE_ETH_REQ = 5000;

    // Token initialy distributed for the team (15%)
    address public constant TEAM_VESTING_WALLET = 0x095f32f02282a043c709bbc45854e72965e94bf2;
    uint public constant TEAM_VESTING_AMOUNT = 150000000 * (10 ** uint256(18));

    // Token initialy distributed for the early investor (20%)
    address public constant EARLY_INVESTOR_WALLET = 0xb80438e752527fa4b3d890a4192f8000025c79f9;
    uint public constant EARLY_INVESTOR_AMOUNT = 200000000 * (10 ** uint256(18));

    // Token initialy distributed for the early foundation (15%)
    // wallet use also to gather the ether of the token sale
    address public constant REQUEST_FOUNDATION_WALLET = 0x4e96617d23a9d6d41fe706f159c0bdc7ee97db0d;
    uint public constant REQUEST_FOUNDATION_AMOUNT = 150000000 * (10 ** uint256(18));

    // PERIOD WHEN TOKEN IS NOT TRANSFERABLE AFTER THE SALE
    uint public constant PERIOD_AFTERSALE_NOT_TRANSFERABLE_IN_SEC = 3 days;

    function RequestTokenSale(uint256 _startTime, uint256 _endTime)
      ProgressiveIndividualCappedCrowdsale()
      WhitelistedCrowdsale()
      CappedCrowdsale(HARD_CAP_IN_ETHER)
      StandardCrowdsale(_startTime, _endTime, RATE_ETH_REQ, REQUEST_FOUNDATION_WALLET)
    {
        address vestingAccount = TEAM_VESTING_WALLET; // avoid TypeError: Member "transfer" is not available in contract StandardToken outside of storage.
        token.transfer(vestingAccount, TEAM_VESTING_AMOUNT);

        address earlyInvestorAccount = EARLY_INVESTOR_WALLET; // avoid TypeError: Member "transfer" is not available in contract StandardToken outside of storage.
        token.transfer(earlyInvestorAccount, EARLY_INVESTOR_AMOUNT);

        address requestFoundationAccount = REQUEST_FOUNDATION_WALLET; // avoid TypeError: Member "transfer" is not available in contract StandardToken outside of storage.
        token.transfer(requestFoundationAccount, REQUEST_FOUNDATION_AMOUNT);
    }

    // override Crowdsale.createTokenContract to create RequestToken token
    function createTokenContract () 
      internal 
      returns(StandardToken) 
    {
        return new RequestToken(TOTAL_REQUEST_TOKEN_SUPPLY, endTime+PERIOD_AFTERSALE_NOT_TRANSFERABLE_IN_SEC, REQUEST_FOUNDATION_WALLET, EARLY_INVESTOR_WALLET);
    }

    // Drain the token not saled to the request Foundation multisign wallet
    function drainRemainingToken () 
      public
      onlyOwner
    {
        require(hasEnded());
        address requestFoundationWallet = REQUEST_FOUNDATION_WALLET; // avoid TypeError: Member "transfer" is not available in contract StandardToken outside of storage.
        token.transfer(requestFoundationWallet, token.balanceOf(this));
    }
  
}
  