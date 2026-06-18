// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {

constructor() ERC20("MyToken", "MTK") {
    // initialisation du token
  }

  function buyToken() external payable {
    require(msg.value > 0, "You need to send some ether");
    uint256 amountToBuy = msg.value * 100; // 1 ether = 100 tokens
    _mint(msg.sender, amountToBuy);
  }

}