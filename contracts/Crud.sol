// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

contract Crud {
    struct User {
        uint256 id;
        string name;
    }

    User[] public users;
    uint256 public nextId = 1;

    enum ChangeType {
        Create,
        Update,
        Delete
    }

    event StateChanged(uint256 id, string name, ChangeType changeType);

    error CRUD__UserNotFound(uint256 id);

    function createUser(string memory name) public {
        users.push(User(nextId, name));
        emit StateChanged(nextId, name, ChangeType.Create);
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
        emit StateChanged(i, name, ChangeType.Update);
    }

    function deleteUserById(uint256 id) public {
        uint256 i = findUserIndex(id);
        string memory deletedName = users[i].name;
        delete users[i];
        emit StateChanged(id, deletedName, ChangeType.Delete);
    }

    function findUserIndex(uint256 id) internal view returns (uint256) {
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i].id == id) return i;
        }
        revert CRUD__UserNotFound(id);
    }
}
