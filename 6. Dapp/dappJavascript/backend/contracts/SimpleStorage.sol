// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract SimpleStorage {

    uint256 myNumber;

    function getNumber() external view returns(uint256) {
        return myNumber;
    }

    function setNumber(uint256 _myNumber) external {
        myNumber = _myNumber;
    }

}