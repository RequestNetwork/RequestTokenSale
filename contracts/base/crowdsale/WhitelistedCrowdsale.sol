pragma solidity ^0.4.11;

import "./StandardCrowdsale.sol";
import '../ownership/Ownable.sol';

/**
 * @title CrowdsaleWhitelisted
 * @dev This is an extension to add whitelist to your crowdsale
 * @author vrolland@Request
 *
 */
contract WhitelistedCrowdsale is StandardCrowdsale, Ownable {
  // the white list
  mapping(address=>bool) public registered;

  event RegistrationStatusChanged( address target, bool isRegistered );

  /// @dev Changes registration status of an address for participation. 0x style
  /// @param target Address that will be registered/deregistered.
  /// @param isRegistered New registration status of address.
  function changeRegistrationStatus(address target, bool isRegistered)
      public
      onlyOwner
      only24HBeforeSale
  {
      registered[target] = isRegistered;
      RegistrationStatusChanged( target, isRegistered );
  }

  /// @dev Changes registration statuses of addresses for participation. 0x style
  /// @param targets Addresses that will be registered/deregistered.
  /// @param isRegistered New registration status of addresss.
  function changeRegistrationStatuses(address[] targets, bool isRegistered)
      public
      onlyOwner
      only24HBeforeSale
  {
      for (uint i = 0; i < targets.length; i++) {
          changeRegistrationStatus(targets[i], isRegistered);
      }
  }

  // overriding Crowdsale#validPurchase to add whilelist
  // @return true if investors can buy at the moment, false otherwise
  function validPurchase() internal constant returns (bool) {
    return super.validPurchase() && registered[msg.sender];
  }
}
  