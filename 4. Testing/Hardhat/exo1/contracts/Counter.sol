// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Counter {
  uint public x;

  event Increment(uint by);

  function inc() payable public {
    x++;
    emit Increment(1);
  }

// ajouter un require, et deux test sur un changement de x et sur le require -----

  function incBy(uint by) public {
    require(by >2, "incBy: increment should be more than two");
    x += by;
    emit Increment(by);
  }
}
