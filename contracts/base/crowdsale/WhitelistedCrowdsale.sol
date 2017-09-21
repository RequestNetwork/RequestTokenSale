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
  mapping(address=>bool) public whiteList;

  event StatusUserUpdatedWhiteList( address user, bool accepted );
  // update status of one user: if accepted is true the user is added to the whiteList
  function updateOneUser( address _user, bool _accepted ) onlyOwner {
      whiteList[_user] = _accepted;
      StatusUserUpdatedWhiteList( _user, _accepted );
  }

  // update a bunch of user 
  // an optimization in case of network congestion
  function updateWhiteList( address[] _users, bool[] _acceptations ) onlyOwner {
      require(_users.length == _acceptations.length );
      for( uint i = 0 ; i < _users.length ; i++ ) {
          updateOneUser( _users[i], _acceptations[i] );
      }
  }

  // overriding Crowdsale#validPurchase to add whilelist
  // @return true if investors can buy at the moment, false otherwise
  function validPurchase() internal constant returns (bool) {
    return super.validPurchase() && whiteList[msg.sender];
  }
}
  