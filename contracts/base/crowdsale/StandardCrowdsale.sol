pragma solidity ^0.4.11;

import '../token/StandardToken.sol';
import '../math/SafeMath.sol';

/**
 * @title Crowdsale
 * @dev Crowdsale is a base contract for managing a token crowdsale.
 * Crowdsales have a start and end timestamps, where investors can make
 * token purchases and the crowdsale will assign them tokens based
 * on a token per ETH rate. Funds collected are forwarded to a wallet
 * as they arrive.
 */
contract StandardCrowdsale {
  using SafeMath for uint256;

  // The token being sold
  StandardToken public token; // REQUEST-NOTE : change to not mintable

  // start and end timestamps where investments are allowed (both inclusive)
  uint256 public startTime;
  uint256 public endTime;

  // address where funds are collected
  address public wallet;

  // how many token units a buyer gets per wei
  uint256 public rate;

  // amount of raised money in wei
  uint256 public weiRaised;

  /**
   * event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(address indexed purchaser, uint256 value, uint256 amount);

  function StandardCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, uint _tokenTotalAmount) {
    require(_startTime >= now);
    require(_endTime >= _startTime);
    require(_rate > 0);
    require(_wallet != 0x0);

    token = createTokenContract(_tokenTotalAmount, _wallet); // REQUEST-NOTE : change to not mintable and accept parameters
    startTime = _startTime;
    endTime = _endTime;
    rate = _rate;
    wallet = _wallet;
  }

  // creates the token to be sold.
  // REQUEST-NOTE : change to not mint and accept parameters
  function createTokenContract(uint _tokenTotalAmount, address _wallet) 
    internal 
    returns(StandardToken) 
  {
    return new StandardToken();
  }

  // fallback function can be used to buy tokens
  function () 
    payable 
  {
    buyTokens();
  }

  // low level token purchase function
  // REQUEST-NOTE : change to not mint but transfer from this contract
  function buyTokens() 
    public 
    payable 
  {
    require(validPurchase());

    uint256 weiAmount = msg.value;

    // calculate token amount to be created
    uint256 tokens = weiAmount.mul(rate);

    // update state
    weiRaised = weiRaised.add(weiAmount);

    token.transfer(msg.sender, tokens); // REQUEST-NOTE : changed here
    TokenPurchase(msg.sender, weiAmount, tokens);

    forwardFunds();
  }

  // send ether to the fund collection wallet
  // override to create custom fund forwarding mechanisms
  function forwardFunds() 
    internal 
  {
    wallet.transfer(msg.value);
  }

  // @return true if the transaction can buy tokens
  function validPurchase() 
    internal 
    constant 
    returns(bool) 
  {
    bool withinPeriod = now >= startTime && now <= endTime;
    bool nonZeroPurchase = msg.value != 0;
    return withinPeriod && nonZeroPurchase;
  }

  // @return true if crowdsale event has ended
  function hasEnded() 
    public 
    constant 
    returns(bool) 
  {
    return now > endTime;
  }

  modifier onlyBeforeSale() {
    require(now < startTime);
    _;
  }

  modifier only24HBeforeSale() {
    require(now < startTime-(1 days));
    _;
  }
}
