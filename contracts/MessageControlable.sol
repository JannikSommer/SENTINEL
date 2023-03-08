// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

/**
 * @title Controlling access from other address
 * @author Jannik Lucas Sommer & Magnus Mølgaard Lund
 * @notice Derived from OpenZeppelin Address.sol
 */

contract MessageControlable {
  /**
   * @dev requires that msg.sender (address) is a smart contract
   */
  modifier onlyContract() {
    require(msg.sender.code.length > 0, "Call only accesible from smart contract");
    _;
  }
}