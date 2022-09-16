// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

contract Crud {
    struct User {
        uint256 id;
        string name;
    }
    User[] public users;

    uint256 public nextId = 1;

    function createUser(string memory name) public {
        users.push(User(nextId, name));
        nextId++;
    }

    // this return signature will allow us to use DeStructuring at the consumer side
    function findUserById(uint256 id) public view returns (uint256, string memory) {
        uint256 i = findUserIndex(id);
        return (users[i].id, users[i].name);
    }

    function updateUser(uint256 id, string memory name) public {
        uint256 i = findUserIndex(id);
        users[i].name = name;
    }

    function deleteUserById(uint256 id) public {
        uint256 i = findUserIndex(id);
        delete users[i];
    }

    function findUserIndex(uint256 id) internal view returns (uint256) {
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i].id == id) return i;
        }
        revert("User does not exist");
    }
}
