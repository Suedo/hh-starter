// pay some amount to enter the lottery
// pick a verifiably random winner
// winner to be selected every X minutes -> automated

// Chainlink: Oracle for randomness, Keepers for automated execution

// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

import "hardhat/console.sol";

/* Errors */
error Raffle__entranceFeeNotMet();
error Raffle__outOfBounds();

contract Raffle {
    /* State */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players; // needs to be payable as we'll need to pay the winner

    /* Events */
    event PlayerAdded(address indexed player, uint256 idx);

    //

    constructor(uint256 _entranceFee) {
        i_entranceFee = _entranceFee;
    }

    /* accessors */
    function getEntranceFee() external view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 _idx) external view returns (address) {
        if (_idx >= s_players.length) revert Raffle__outOfBounds();
        return s_players[_idx];
    }

    /**
     * A player will call this function while passing a sufficient ether value to pass the entrance fee check
     */
    function enterRaffle() external payable {
        if (msg.value < i_entranceFee) revert Raffle__entranceFeeNotMet();
        s_players.push(payable(msg.sender));
        emit PlayerAdded(msg.sender, s_players.length - 1); // emit event whenever updating a dynamic DS
    }

    function pickRandomWinner() external {}
}
