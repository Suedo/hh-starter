// pay some amount to enter the lottery
// pick a verifiably random winner
// winner to be selected every X minutes -> automated

// Chainlink: Oracle for randomness, Keepers for automated execution

// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

/* Errors */
error Raffle__entranceFeeNotMet();
error Raffle__outOfBounds();
error Raffle__TransferFailedError();
error Raffle__NotOpen();
// we are casting enum to uint because enum is defined inside the contract
error Raffle__UpkeepNotNeeded(uint256 balance, uint256 playerCount, uint256 raffleState);

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface, Ownable {
    /* Types */
    enum RaffleState {
        OPEN,
        CALCULATING // no new members now
    }

    /* State */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players; // needs to be payable as we'll need to pay the winner
    VRFCoordinatorV2Interface private immutable i_vrfCoordinatorV2;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint256 private immutable i_interval;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // lottery variables
    address payable private s_recentWinner;
    RaffleState private s_raffleState;
    uint256 private s_lastTimeStamp;

    /* Events */
    event PlayerAdded(address indexed player, uint256 idx);
    event RequestedRaffleWinner(uint256 requestId);
    event WinnerPicked(address indexed winner);

    constructor(
        address _vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint256 interval,
        uint256 _entranceFee,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(_vrfCoordinatorV2) {
        i_entranceFee = _entranceFee;
        i_vrfCoordinatorV2 = VRFCoordinatorV2Interface(_vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    /**
     * A player will call this function while passing a sufficient ether value to pass the entrance fee check
     */
    function enterRaffle() external payable {
        if (msg.value < i_entranceFee) revert Raffle__entranceFeeNotMet();
        if (s_raffleState != RaffleState.OPEN) revert Raffle__NotOpen();
        s_players.push(payable(msg.sender));
        emit PlayerAdded(msg.sender, s_players.length - 1); // emit event whenever updating a dynamic DS
    }

    /**
     * @dev This is the function that the Chainlink Keeper nodes call
     * they look for `upkeepNeeded` to return True. in which case,
     * the performUpkeep is called to essentially pick a lottery winner
     *
     * This will return true if:
     * 1. our time interval has passed
     * 2. the lottery should have atleast 1 player, and have some eth
     * 3. our subscription is funded with link
     * 4. the lottery should be in "open" state
     */
    function checkUpkeep(bytes calldata checkData)
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        bool isOpen = s_raffleState == RaffleState.OPEN;
        bool timePassed = (block.timestamp - s_lastTimeStamp) > i_interval;
        bool hasPlayers = s_players.length > 0;
        bool hasFunds = address(this).balance > 0;
        upkeepNeeded = isOpen && timePassed && hasPlayers && hasFunds;
        performData = checkData;
    }

    /**
     * @dev Once `checkUpkeep` is returning `true`, this function is called
     * and it kicks off a Chainlink VRF call to get a random winner.
     * Also, Assumes the subscription is funded sufficiently.
     */
    function performUpkeep(bytes calldata performData) external override {
        // chainlink recommends to re-evaluate the checkUpkeep here
        (bool upkeepNeeded, ) = checkUpkeep(performData);
        if (!upkeepNeeded)
            revert Raffle__UpkeepNotNeeded(address(this).balance, s_players.length, uint256(s_raffleState));

        // Change state from OPEN to CALCULATING
        if (s_raffleState != RaffleState.OPEN) revert Raffle__NotOpen();
        s_raffleState = RaffleState.CALCULATING;

        uint256 requestId = i_vrfCoordinatorV2.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        emit RequestedRaffleWinner(requestId);
    }

    /**
     * @dev This is the function that Chainlink VRF node
     * calls to send the money to the random winner.
     */
    function fulfillRandomWords(
        uint256, /* requestId */
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;

        // winner found, reset Raffle
        s_raffleState = RaffleState.OPEN;
        s_players = new address payable[](0); // lottery completed, enter with new money for next lottery
        s_lastTimeStamp = block.timestamp; // so that next lottery can wait interval amount of time

        (bool success, ) = s_recentWinner.call{value: address(this).balance}("");
        if (!success) revert Raffle__TransferFailedError();
        emit WinnerPicked(s_recentWinner);
    }

    /* accessors */
    function getEntranceFee() external view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 _idx) external view returns (address) {
        if (_idx >= s_players.length) revert Raffle__outOfBounds();
        return s_players[_idx];
    }

    function getRecentWinner() external view returns (address) {
        return s_recentWinner;
    }

    /** Getter Functions */

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    // notice that we have 'pure' as method type
    // this is because NUM_WORDS is a constant, coded into the bytecode
    // and not fetched from storage
    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }
}
