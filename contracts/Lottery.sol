// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

contract Lottery {
    address payable public owner;
    address payable[] players;
    uint256 public totalAmount;
    event Received(address from, uint256 amount, uint256 total); // print details for received amount
    event Sent(address from, address to, uint256 amount); // print details regarding amount transferred
    event Winner(address winnerAddress);
    event Selection(uint256 blocktime, uint256 playerCount, uint256 result);

    constructor() {
        owner = msg.sender;
    }

    modifier isOwner() {
        require(msg.sender == owner, "Must be owner to throw dice");
        _;
    }

    receive() external payable {
        totalAmount += msg.value;
        uint256 idx = findPlayerIndex(msg.sender);
        if (idx == 999) {
            require(players.length < 4, "Maximum 4 players allowed");
            players.push(msg.sender); // new player
        }
        emit Received(msg.sender, msg.value, totalAmount);
    }

    function throwDice() external isOwner returns (address payable) {
        uint256 winner = selectRandom();
        emit Winner(players[winner]);
        players[winner].transfer(totalAmount);
        emit Sent(address(this), players[winner], totalAmount);
        totalAmount = 0;
        return players[winner];
    }

    function getPlayers() public view returns (address payable[] memory) {
        return players;
    }

    function findPlayerIndex(address addr) internal view returns (uint256) {
        for (uint256 i = 0; i < players.length; i++) {
            if (players[i] == addr) return i;
        }
        return 999;
    }

    function selectRandom() public returns (uint256) {
        uint256 time = block.timestamp; // seconds since epoch
        uint256 result = time % players.length;
        emit Selection(time, players.length, result);
        return result;
    }
}

/* 
Calling selectRandom gives this output (notice the event log)
----------------------------------------------------------------------------------------------------

[
	{
		"from": "0xd9145cce52d386f254917e481eb44e9943f39138",
		"topic": "0x73b2df324921aef107099eadbf890c51c1dff3e7a4c0126cdb5afa3c7454f816",
		"event": "Selection",
		"args": {
			"0": "1605340365",
			"1": "4",
			"2": "1",
			"blocktime": "1605340365",
			"playerCount": "4",
			"result": "1",
			"length": 3
		}
	}
]

Below is the output of ThrowDice when called from the owner address. 
Notice the sequence of events in the log
----------------------------------------------------------------------------------------------------

[
	{
		"from": "0xd9145cce52d386f254917e481eb44e9943f39138",
		"topic": "0x73b2df324921aef107099eadbf890c51c1dff3e7a4c0126cdb5afa3c7454f816",
		"event": "Selection",
		"args": {
			"0": "1605340412",
			"1": "4",
			"2": "0",
			"blocktime": "1605340412",
			"playerCount": "4",
			"result": "0",
			"length": 3
		}
	},
	{
		"from": "0xd9145cce52d386f254917e481eb44e9943f39138",
		"topic": "0x745c90b656b4aafe296c8ca35aeacfe56cb96c90e1d320e5da643fff1051b6c0",
		"event": "Winner",
		"args": {
			"0": "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
			"winnerAddress": "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
			"length": 1
		}
	},
	{
		"from": "0xd9145cce52d386f254917e481eb44e9943f39138",
		"topic": "0x3990db2d31862302a685e8086b5755072a6e2b5b780af1ee81ece35ee3cd3345",
		"event": "Sent",
		"args": {
			"0": "0xd9145CCE52D386f254917e481eB44e9943F39138",
			"1": "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
			"2": "0",
			"from": "0xd9145CCE52D386f254917e481eB44e9943F39138",
			"to": "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
			"amount": "0",
			"length": 3
		}
	}
]

*/
