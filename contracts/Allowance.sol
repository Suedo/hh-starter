// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * This contract is like a PiggyBank, where funds are deposited
 * some number of kids will get their allowances payed out from here
 */
contract Allowance is ReentrancyGuard, Ownable {
    mapping(address => uint256) private allowance;
    mapping(address => uint256) private balanceOf;
    mapping(address => bool) private dependents;

    enum ChangeType {
        None,
        Increase,
        Decrease
    }

    event Received(address recipient, address from, uint256 amount, uint256 total); // print details for received amount
    event Transferred(address from, address to, uint256 amount); // print details regarding amount transferred
    event AllowanceLimitChange(address user, uint256 oldLimit, ChangeType delta, uint256 newLimit);
    event AllowanceChange(address user, uint256 maxAllowance, ChangeType delta, uint256 currentBalance);
    event DependentAdded(address dependent);

    modifier dependentAdded(address _dependent) {
        require(dependents[_dependent] == true, "Dependent not added");
        _;
    }

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

    function addDependent(address _dependent) external onlyOwner {
        require(dependents[_dependent] == false, "Dependent already added");
        dependents[_dependent] = true;
        allowance[_dependent] = 0;
        emit DependentAdded(_dependent);
    }

    function changeAllowanceLimit(
        address _dependent,
        uint256 amount,
        ChangeType changeType
    ) external onlyOwner dependentAdded(_dependent) nonReentrant returns (uint256) {
        if (changeType == ChangeType.Decrease) {
            require(allowance[_dependent] >= amount, "Cannot reduce allowance below 0");
            allowance[_dependent] -= amount;
        } else if (changeType == ChangeType.Increase) {
            allowance[_dependent] += amount;
        } else {
            allowance[_dependent] = amount;
        }
        emit AllowanceLimitChange(_dependent, amount, changeType, allowance[_dependent]);
        return allowance[_dependent];
    }

    // The owner now gives these accounts their allowance sum
    function giveAllowance(address _dependent, uint256 amount)
        external
        onlyOwner
        dependentAdded(_dependent)
        nonReentrant
        returns (uint256)
    {
        require(balanceOf[owner()] >= amount, "Owner Balance Low");
        require(allowance[_dependent] >= balanceOf[_dependent] + amount, "Cannot give more than allowance limit");

        balanceOf[owner()] -= amount;
        balanceOf[_dependent] += amount;

        emit AllowanceChange(_dependent, allowance[_dependent], ChangeType.Increase, balanceOf[_dependent]);
        return balanceOf[_dependent]; // updated allowance balance
    }

    /**
     * This will be called by the dependents to withdraw their allowance
     * 1. prefer `call{value: amount}` over transfer: https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/
     * 2.   we are calling an external account. this is unsafe.
     *      using check-effect-interact strategy + nonReentrant guard to protect us
     *      still, we should look at 'pull over push' strategy in PROD
     */
    function withdraw(uint256 _amount) external nonReentrant dependentAdded(msg.sender) returns (uint256) {
        /* check */
        require(balanceOf[msg.sender] > _amount, "Not enough Funds");
        /* effect */
        balanceOf[msg.sender] -= _amount;
        /* interact */
        (bool success, ) = msg.sender.call{value: _amount}("");

        require(success, "Transfer failed.");
        emit Transferred(address(this), msg.sender, _amount);
        return balanceOf[msg.sender]; // updated balance
    }
}
