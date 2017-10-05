# Request Network Token Sale
In this document, we describe the token sale specification and implementation,
and give an overview over the smart contracts structure.

## Informal Specification
The token sale is open only to registered users.
Every user has the same individual cap for the amount of Ether he can contribute.
In the sale, bounded number of tokens is offered (e.g., there is hard cap for raised ether).

In the first 24 hours user contribution is limited by the individual cap.
In the second 24 hours, the individual cap is double.
In the next 24 hours, the individual cap is double again etc.. until token supply is depleted.

Preminted tokens are allocated to 4 differents addresses.
* 500000000 REQ (50%) are sent to the token sale contract
* 150000000 REQ (15%) are sent to the team vesting contract
* 150000000 REQ (15%) are sent to the foundation multisig wallet
* 200000000 REQ (20%) are sent to the early investors multisig wallet



## Detailed description

### Overview of flow
Denote by T the start time of the token sale.

1. On T - 5 days, we deploy `RequestTokenSale.sol` which will deploy also `Requestoken.sol`. And, we list users for the whitelist
The listing is done by us with a standard private key.
Upon deployment, preminted tokens are already distributed to the 4 differents addresses.
We manually verify that preminted tokens were assigned to the correct addresses.
Token transfers are enabled only for the early investors multisig wallet, the foundation multisig wallet and the token sale contract,
We start to give the token to the early investor via the early investors multisig wallet.

2. On T - 3, We compute the individual cap and set it up on the blockchain thanks to the entry "RequestTokenSale/setBaseEthCapPerAddress()"

3. On T-1, baseEthCapPerAddress and whitelist are not modifiable anymore. 
We check the cap and the whitelist.

4. On T, the sale starts. At this point users can buy tokens according to the individual caps.
It is possible to buy several times, as long as cap is not exceeded.
5. On T+1, the sale continue but the individual cap is double.
6. On T+2, the sale continue if the hard cap is not reached with an individual cap double again.
7. On T+3, the sale continue if the hard cap is not reached with an individual cap double again.

8. On T+4, token sale is over. 
We drain the tokens not sold to the foundation mutlisign wallet with the entry RequestTokenSale.drainRemainingToken()

9. on T+7, token transfers are enabled for everyone.



### Per module description
The system has 2 modules : the token sale (RequestTokenSale.sol) and the token (RequestToken.sol)

#### The token sale (RequestTokenSale.sol)
Implemented in `RequestTokenSale.sol`. 

It inherits from `StandardCrowdsale.sol` from Open Zeppelin with small changes (see REQUEST-NOTE in comments) providing the basic check for the token sale

It inherits from `CappedCrowdsale.sol` from Open Zeppelin providing the hard cap

It inherits from `ProgressiveIndividualCappedCrowdsale.sol` developped by Request, providing the progressive individual cap.

It inherits from `WhitelistedCrowdsale.sol` developped by Request, providing the White list mechanism

It uses `SafeMath.sol` from Open Zeppelin

Owner can list and delist users until the last 24h before the token sale.
Owner can modify the individual base cap until the last 24h before the token sale.

Because we expect > 10k users, we must start uploading the users before we have a full list.
For this reason we also have an optimized version of listing which can take an array as input.

#### The token (RequestToken.sol)
Implemented in `RequestToken.sol`. 
It inherits from `StandardToken.sol` from Open Zeppelin (ERC20 standard token)
It inherits from `Ownable.sol` from Open Zeppelin
It uses `SafeMath.sol` from Open Zeppelin

The token is fully compatible with ERC20 standard, with the next two additions:
1. The tokens become transferable 7 days after the token sale start.
To be more precise, only the token sale contract, early investor multisign wallet and foundation multisign wallet are allowed to transfer tokens before.

2. A draining function (for ERC20 tokens), in case of.

### Use of zeppelin code
We use open-zeppling code for `SafeMath`, `Ownable` and `StandardToken` logic (and as base code : `StandardCrowdsale.sol`).

# Testrpc commandline
testrpc 
--account="0xad34324f7371dbe4504d3a10239dc1b539839a40ab5ce5938027b1c9dc3430bd,10000000000000000000000000000000000000000000000000000000000000000000000000000" 
--account="0x1ba414a85acdd19339dacd7febb40893458433bee01201b7ae8ca3d6f4e90994,10000000000000000000000000000000000000000000000000000000000000000000000000000"
--account="0x48b97a730734725f3e7cc91cdee82a59c93c1f976c811a4a8b790602e7fd619f,10000000000000000000000000000000000000000000000000000000000000000000000000000"
--account="0xb383a09e0c750bcbfe094b9e17ee31c6a9bb4f2fcdc821d97a34cf3e5b7f5429,10000000000000000000000000000000000000000000000000000000000000000000000000000"
--account="0x5f1859eee362d44b90d4f3cdd14a8775f682e08d34ff7cdca7e903d7ee956b6a,10000000000000000000000000000000000000000000000000000000000000000000000000000"
--account="0x311b38806f4fe591edee839fc7240cd4cf136a81dc69444fcf3c4ce8aba20e0c,10000000000000000000000000000000000000000000000000000000000000000000000000000"
--account="0x3b1b8f928630142d62878e521161780a873961d70002c4d7dabd8e4eea35982f,10000000000000000000000000000000000000000000000000000000000000000000000000000"
--account="0xaea22713416604d48ef525a7c65aea87a638227fb6e42f22e9f412fa99151ec4,10000000000000000000000000000000000000000000000000000000000000000000000000000"
--account="0x69ce511e39c01aabc46bf6280ed0454f83f174a70448b2496e294f359af9d484,10000000000000000000000000000000000000000000000000000000000000000000000000000"
--account="0x97292cc6c00ec2cb8be515be4d6af2ed15e5466587408f57cb2ff46a57c8b5a2,10000000000000000000000000000000000000000000000000000000000000000000000000000" 
