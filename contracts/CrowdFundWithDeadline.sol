// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

contract CrowdFundingWithDeadline {
    enum Status {
        Ongoing,
        Failed,
        Succeeded,
        PaidOut
    } // internally recorded as 0,1,2,3

    string public name;
    uint256 public targetAmount;
    uint256 public fundingDeadline;
    address public beneficiary;
    Status public status;
    mapping(address => uint256) amounts;
    uint256 public totalCollected;
    bool public collected;

    modifier inState(Status expectedStatus) {
        require(status == expectedStatus, "Invalid State");
        _;
    }

    function contribute() public payable inState(Status.Ongoing) {
        amounts[msg.sender] += msg.value;
        totalCollected += msg.value;

        if (totalCollected >= targetAmount) {
            collected = true;
        }
    }

    function isClosed() public view returns (bool) {
        return block.timestamp > fundingDeadline || status != Status.Ongoing;
    }

    function tryClosing() public returns (bool) {
        require(totalCollected >= targetAmount, "Amount not met");
        require(block.timestamp > fundingDeadline, "Time left");
        status = Status.Succeeded;
        return true;
    }

    constructor(
        string memory _contractName,
        uint256 _targetAmountEth,
        uint256 _durationInMin,
        address payable _beneficiary
    ) {
        name = _contractName;
        targetAmount = _targetAmountEth * 1 ether; // convert ether to wei, and save as wei
        fundingDeadline = block.timestamp + (_durationInMin * 1 minutes);
        beneficiary = _beneficiary;
        status = Status.Ongoing;
    }
}
