pragma solidity ^0.4.11;

import "./StandardCrowdsale.sol";
import "./base/token/StandardToken.sol";
import './base/ownership/Ownable.sol';

/**
 * @title ProgressiveIndividualCappedCrowdsale
 * @dev Extension of Crowdsale with a progressive individual cap
 * @author vrolland@Request
 */

contract ProgressiveIndividualCappedCrowdsale is StandardCrowdsale, Ownable {

  uint public constant TIME_PERIOD_IN_SEC = 1 days;
  uint public constant GAS_LIMIT_IN_WEI = 50000000000 wei; // limit gas price -50 Gwei wales stopper
  uint256 public baseEthCapPerAddress = 0 ether;

  mapping(address=>uint) public participated;

  // @dev overriding CappedCrowdsale#validPurchase to add an individual cap
  // @return true if investors can buy at the moment
  function validPurchase() 
    internal 
    constant 
    returns(bool) 
  {
    require( tx.gasprice <= GAS_LIMIT_IN_WEI);
    uint ethCapPerAddress = getCurrentEthCapPerAddress();
    participated[msg.sender] = participated[msg.sender].add(msg.value);
    return super.validPurchase() && participated[msg.sender] <= ethCapPerAddress;
  }

  // @dev Set the individual cap for the first day. This function can not be called withing the 24h before the sale for security reasons
  // @param _baseEthCapPerAddress base cap in wei
  function setBaseEthCapPerAddress(uint256 _baseEthCapPerAddress) 
    public
    onlyOwner 
    only24HBeforeSale
  {
    baseEthCapPerAddress = _baseEthCapPerAddress;
  }

  // @dev Get the current individual cap. 
  // This amount increase everyday in an exponential way. Day 1: base cap, Day 2: 2 * base cap, Day 3: 4 * base cap ...
  function getCurrentEthCapPerAddress() 
    public
    returns(uint)
  {
    if (block.timestamp < startTime || startTime == 0) return 0;
    uint timeSinceStartInSec = block.timestamp.sub(startTime);
    uint currentPeriod = timeSinceStartInSec.div(TIME_PERIOD_IN_SEC).add(1);
    return (2 ** currentPeriod.sub(1)).mul(baseEthCapPerAddress);
  }
}
  