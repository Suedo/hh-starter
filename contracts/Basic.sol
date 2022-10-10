// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

/**
 * This contract is like a PiggyBank, where funds are deposited
 * some number of kids will get their allowances payed out from here
 */
contract Basic is ReentrancyGuard, Ownable {
  mapping(address => uint256) private balanceOf;

  event Received(address recipient, address from, uint256 amount, uint256 total); // print details for received amount

  // give funds to this contract's owner
  receive() external payable {
    balanceOf[owner()] += msg.value;
    console.log("Received %s from address: %s, to be added to %s", msg.value, msg.sender, owner());
    emit Received(owner(), msg.sender, msg.value, balanceOf[owner()]);
  }

  function getBalance() external view returns (uint256) {
    return balanceOf[msg.sender];
  }

  function getBalanceOf(address addr) external view returns (uint256) {
    return balanceOf[addr];
  }
}
