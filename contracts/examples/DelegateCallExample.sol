// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

error DelegateCallOnEmptyContract();
error NoCalldataSpecified();

// NOTE: Deploy this contract first, because u need it's address below
contract Tester {
    // NOTE: storage layout must be the same as contract A
    uint256 public num;
    address public sender;
    uint256 public value;

    event TesterEvent(uint256 num, address delegateCaller, uint256 value);

    function setVars(uint256 _num) public payable {
        console.log("Tester: setting values %s, %s, %s", _num, msg.sender, msg.value);
        num = _num;
        sender = msg.sender;
        value = msg.value;

        emit TesterEvent(_num, sender, value);
    }
}

contract Caller {
    uint256 public num;
    address public sender;
    uint256 public value;

    event CallerEvent(bool status, uint256 num, address destination);

    function setVars(address _contract, uint256 _num) public payable {
        console.log("Caller: Call contract at %s passing number: %s", _contract, _num);
        // A's storage is set, B is not modified.
        (bool success, bytes memory error) = _contract.delegatecall(abi.encodeWithSignature("setVars(uint256)", _num));

        emit CallerEvent(success, _num, _contract);
    }

    function setVarsCalldata(address _contract, bytes memory _calldata) external payable {
        console.log("Caller: call contract at %s via delegateCall with calldata", _contract);
        if (_contract == address(0) && _calldata.length > 0) {
            revert DelegateCallOnEmptyContract();
        }
        if (_contract != address(0) && _calldata.length == 0) {
            // checkout EIP-2535 Diamond's `initializeDiamondCut` method for more pro handling
            revert NoCalldataSpecified();
        }
        (bool success, bytes memory error) = _contract.delegatecall(_calldata);
        if (!success) {
            if (error.length > 0) {
                // bubble up the error
                revert(string(error));
            } else {
                revert("contract delegatecall reverted");
            }
        } else {
            emit CallerEvent(success, 1, _contract);
        }
    }
}

// https://solidity-by-example.org/delegatecall/

// Note that the .selector will not work for functions declared as internal and private, so only available for public and external functions
// https://ethereum.stackexchange.com/a/72690/22522
