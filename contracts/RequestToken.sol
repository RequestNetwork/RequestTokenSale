pragma solidity ^0.4.13;

import './base/token/StandardToken.sol';
import './base/ownership/Ownable.sol';

// Request Network Token (Kyber Style)
contract RequestToken is StandardToken, Ownable {
    string  public  constant name = "Request Token";
    string  public  constant symbol = "REQ";
    uint    public  constant decimals = 18;

    // uint    public  saleStartTime;
    // uint    public  saleEndTime;

    // address public  tokenSaleContract;

    // modifier onlyWhenTransferEnabled() {
    //     if( now <= saleEndTime && now >= saleStartTime ) {
    //         require( msg.sender == tokenSaleContract );
    //     }
    //     _;
    // }

    // modifier validDestination( address to ) {
    //     require(to != address(0x0)); // TODO : ARE WE ABLE TO BURN TOKEN ?
    //     require(to != address(this) );
    //     _;
    // }

    function RequestToken( uint tokenTotalAmount, /*uint startTime, uint endTime, */address admin ) {
        // Mint all tokens. Then disable minting forever.
        totalSupply = tokenTotalAmount * (10 ** uint256(decimals));

        balances[msg.sender] = totalSupply;
        Transfer(address(0x0), msg.sender, totalSupply);

        // saleStartTime = startTime;
        // saleEndTime = endTime;

        // tokenSaleContract = msg.sender;
        transferOwnership(admin); // admin could drain tokens and eth that were sent here by mistake
    }

    // function transfer(address _to, uint _value)
    //     // onlyWhenTransferEnabled
    //     // validDestination(_to)
    //     returns (bool) {
    //     return super.transfer(_to, _value);
    // }

    // function transferFrom(address _from, address _to, uint _value)
    //     // onlyWhenTransferEnabled
    //     // validDestination(_to)
    //     returns (bool) {
    //     return super.transferFrom(_from, _to, _value);
    // }

    function emergencyERC20Drain( ERC20 token, uint amount ) 
        onlyOwner 
    {
        token.transfer( owner, amount );
    }

    function emergencyEthDrain( uint amount ) 
        onlyOwner 
    {
        owner.transfer( amount );
    }
}
