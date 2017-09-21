
pragma solidity ^0.4.11;

// import "./base/crowdsale/CappedCrowdsale.sol";
// import "./base/token/StandardToken.sol";
// import "./RequestQuark.sol";

// /**
//  * @title RequestCrowdsale
//  * @dev This is an example of a fully fledged crowdsale.
//  * The way to add new features to a base crowdsale is by multiple inheritance.
//  * In this example we are providing following extensions:
//  * CappedCrowdsale - sets a max boundary for raised funds
//  *
//  * After adding multiple features it's good practice to run integration tests
//  * to ensure that subcontracts works together as intended.
//  */
// contract RequestCrowdsale is Ownable, CappedCrowdsale {

//   uint public constant TIME_PERIOD_IN_SEC = 1 days;
//   uint256 public baseEthCapPerAddress = 7 ether;

//   // the white list
//   mapping(address=>bool) public whiteList;
//   mapping(address=>uint) public participated;

//   function RequestCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, uint256 _tokenTotalAmount, uint256 _baseEthCapPerAddress, address[] tokenBeforeSaleAddress, uint256[] tokenBeforeSaleAmount)
//     CappedCrowdsale(numberTokenRemainingForSale(_tokenTotalAmount,tokenBeforeSaleAmount).div(_rate))
//     Crowdsale(_startTime, _endTime, _rate, _wallet, _tokenTotalAmount, tokenBeforeSaleAddress, tokenBeforeSaleAmount)
//   {
//     // send the token to specific peoples before the sale
//     require(tokenBeforeSaleAddress.length == tokenBeforeSaleAmount.length);
//     for(uint8 i=0; i<tokenBeforeSaleAddress.length ;i++) {
//       token.transfer(tokenBeforeSaleAddress[i], tokenBeforeSaleAmount[i]);
//     }
//     baseEthCapPerAddress = _baseEthCapPerAddress;
//   }

//   event StatusUserUpdatedWhiteList( address user, bool accepted );
//   function updateOneUser( address _user, bool _accepted ) onlyOwner {
//       whiteList[_user] = _accepted;
//       StatusUserUpdatedWhiteList( _user, _accepted );
//   }

//   // an optimization in case of network congestion
//   function updateWhiteList( address[] _users, bool[] _acceptations ) onlyOwner {
//       require(_users.length == _acceptations.length );
//       for( uint i = 0 ; i < _users.length ; i++ ) {
//           updateOneUser( _users[i], _acceptations[i] );
//       }
//   }

//   // overriding CappedCrowdsale#validPurchase to add indivdual cap
//   // @return true if investors can buy at the moment, false otherwise
//   function validPurchase() internal constant returns (bool) {
//     // not possible to buy until the sale start
//     if (block.timestamp < startTime || startTime == 0) return false;
//     // not possible to buy if not register
//     if (!whiteList[msg.sender]) return false;

//     //  indivdual cap like 0xProject did
//     uint timeSinceStartInSec = block.timestamp.sub(startTime);
//     uint currentPeriod = timeSinceStartInSec.div(TIME_PERIOD_IN_SEC).add(1);
//     uint ethCapPerAddress = (2 ** currentPeriod).sub(1).mul(baseEthCapPerAddress);
    
//     // update the participation (add will throw if overflow)
//     participated[msg.sender] = participated[msg.sender].add(msg.value);

//     // participation will be rollback if it overpass the individual cap
//     return super.validPurchase() && participated[msg.sender] <= ethCapPerAddress;
//   }


//   // overide Crowdsale.createTokenContract to create RequestQuark token
//   function createTokenContract(uint _tokenTotalAmount, address _admin) internal returns (StandardToken) {
//     return new RequestQuark(_tokenTotalAmount, _admin);
//   }

//   // INTERNAL : Compute the number of token remaining for Sale - only use in constructor
//   function numberTokenRemainingForSale(uint256 _totalSupplyToken, uint256[] _tokenBeforeSaleAmount) internal returns(uint256) {
//     uint256 totalForSale = _totalSupplyToken;
//     for(uint8 i=0; i<_tokenBeforeSaleAmount.length ;i++) {
//       totalForSale -= _tokenBeforeSaleAmount[i];
//     }
//     return totalForSale;
//   }

//   function setBaseEthCapPerAddress(uint256 _baseEthCapPerAddress) onlyOwner {
//     baseEthCapPerAddress = _baseEthCapPerAddress;
//   }
// }
//   