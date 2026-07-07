// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

error NumberTooBig();

contract SimpleStorage {
    uint256 private myNumber;

    event NumberChanged(address indexed by, uint256 number);

    function setMyNumber(uint256 _myNumber) external {
        require(_myNumber < 10, NumberTooBig());
        myNumber = _myNumber;
        emit NumberChanged(msg.sender, _myNumber);
    }

    function getMyNumber() external view returns (uint256) {
        return myNumber;
    }
}