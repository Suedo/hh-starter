// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Allowance is ReentrancyGuard, Ownable {
    mapping(address => uint256) allowance;
    mapping(address => uint256) balanceOf;
    enum ChangeType {
        None,
        Increase,
        Decrease
    }

    event Received(address recipient, address from, uint256 amount, uint256 total); // print details for received amount

    event Transfer(address from, address to, uint256 amount); // print details regarding amount transferred
    event AllowanceLimitChange(address user, uint256 oldLimit, ChangeType delta, uint256 newLimit);
    event AllowanceChange(address user, uint256 maxAllowance, ChangeType delta, uint256 currentBalance);

    // give funds to this contract's owner
    receive() external payable {
        balanceOf[owner()] += msg.value;
        emit Received(owner(), msg.sender, msg.value, balanceOf[owner()]);
    }

    function getBalance() external view returns (uint256) {
        return balanceOf[msg.sender];
    }

    function getAllowance(address user) external view returns (uint256) {
        return allowance[user];
    }

    function changeAllowanceLimit(
        address user,
        uint256 amount,
        ChangeType changeType
    ) external onlyOwner nonReentrant returns (uint256) {
        if (changeType == ChangeType.Decrease) {
            require(allowance[user] >= amount, "Cannot reduce allowance below 0");
            allowance[user] -= amount;
        } else if (changeType == ChangeType.Increase) {
            allowance[user] += amount;
        } else {
            allowance[user] = amount;
        }
        emit AllowanceLimitChange(user, amount, changeType, allowance[user]);
        return allowance[user];
    }

    // The owner now gives these accounts their allowance sum
    function giveAllowanceMoney(address user, uint256 amount) external onlyOwner nonReentrant returns (uint256) {
        require(balanceOf[owner()] >= amount, "Owner Balance Low");
        require(allowance[user] >= balanceOf[user] + amount, "Cannot give more than allowance limit");
        balanceOf[owner()] -= amount;
        balanceOf[user] += amount;
        emit AllowanceChange(user, allowance[user], ChangeType.Increase, balanceOf[user]);
        return balanceOf[user]; // updated allowance balance
    }

    /* 
    function withdraw(address payable to, uint256 amount) external onlyOwner nonReentrant {
    we are no longer using `to.transfer` approach, so `to` address is also not needed
    https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/
  */
    function withdraw(uint256 amount) external nonReentrant returns (uint256) {
        require(balanceOf[msg.sender] > amount, "Not enough Funds");
        balanceOf[msg.sender] -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed.");
        emit Transfer(address(this), msg.sender, amount);
        return balanceOf[msg.sender]; // updated balance
    }
}
