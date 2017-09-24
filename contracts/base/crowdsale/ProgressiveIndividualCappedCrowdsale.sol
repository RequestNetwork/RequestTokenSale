pragma solidity ^0.4.11;

import "../crowdsale/StandardCrowdsale.sol";
import "../token/StandardToken.sol";
import '../ownership/Ownable.sol';

/**
 * @title RequestCrowdsale
 * @dev This is an example of a fully fledged crowdsale.
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * In this example we are providing following extensions:
 * CappedCrowdsale - sets a max boundary for raised funds
 *
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 */
contract ProgressiveIndividualCappedCrowdsale is StandardCrowdsale, Ownable {

  uint public constant TIME_PERIOD_IN_SEC = 1 days;
  uint public constant GAS_LIMIT_IN_WEI = 50000000000 wei; // limit gas price -50 Gwei wales stopper
  uint256 public baseEthCapPerAddress = 0 ether;

  // the white list
  mapping(address=>uint) public participated;

  // overriding CappedCrowdsale#validPurchase to add indivdual cap
  // @return true if investors can buy at the moment, false otherwise
  function validPurchase() 
    internal 
    constant 
    returns(bool) 
  {
    // limit gas price - wales stopper
    require( tx.gasprice <= GAS_LIMIT_IN_WEI);

    //  indivdual cap like 0xProject did
    uint ethCapPerAddress = getCurrentEthCapPerAddress();

    // update the participation (add will throw if overflow)
    participated[msg.sender] = participated[msg.sender].add(msg.value);

    // participation will be rollback if it overpass the individual cap
    return super.validPurchase() && participated[msg.sender] <= ethCapPerAddress;
  }

  function setBaseEthCapPerAddress(uint256 _baseEthCapPerAddress) 
    public
    onlyOwner 
    only24HBeforeSale
  {
    baseEthCapPerAddress = _baseEthCapPerAddress;
  }

  //  indivdual cap like 0xProject did
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
  