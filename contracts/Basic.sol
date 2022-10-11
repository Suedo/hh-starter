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
  uint256 private s_counter;

  event Received(address recipient, address from, uint256 amount, uint256 total, uint256 counter); // print details for received amount
  event Created(address creator, address owner, uint256 initialAmount, uint256 counter); // print details for received amount

  constructor(uint256 counter) payable {
    s_counter = counter;
    balanceOf[msg.sender] = msg.value;
    emit Created(msg.sender, owner(), msg.value, s_counter);
  }

  // give funds to this contract's owner
  receive() external payable {
    balanceOf[owner()] += msg.value;
    s_counter++;
    console.log("Received %s from address: %s, to be added to %s", msg.value, msg.sender, owner());
    emit Received(owner(), msg.sender, msg.value, balanceOf[owner()], s_counter);
  }

  function getBalance() external view returns (uint256) {
    return balanceOf[msg.sender];
  }

  function getBalanceOf(address addr) external view returns (uint256) {
    return balanceOf[addr];
  }

  function getCounter() public view returns (uint256) {
    return s_counter;
  }
}
