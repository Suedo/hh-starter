import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {assert, expect} from "chai";
import {BigNumber} from "ethers";
import {deployments, ethers, getNamedAccounts, network} from "hardhat";
import {networkConfig} from "../helper-hardhat-config";
import {Raffle} from "../typechain-types/contracts/Raffle";

describe("Raffle", () => {
    let raffle: Raffle;
    let RaffleState = {
        OPEN: 0,
        CALCULATING: 1,
    };
    let accounts: SignerWithAddress[];
    let player1: SignerWithAddress;
    let deployer;
    let chainId: number;
    let entranceFee: BigNumber;
    let interval: number;

    beforeEach(async () => {
        accounts = await ethers.getSigners();
        player1 = accounts[1];
        deployer = (await getNamedAccounts()).deployer;
        console.log(`Main BeforeEach...`);
        await deployments.fixture(["raffle", "mocks"]);
        raffle = await ethers.getContract("Raffle", deployer);
        chainId = network.config.chainId || 31337;
        entranceFee = networkConfig[chainId].raffleEntranceFee;
        interval = networkConfig[chainId].keepersUpdateInterval;
        //console.log("-".repeat(80));
    });

    /* increase BC timestamp, and then mine a block to persist it for BC participants to be able to see */
    const increaseTime = async (time: number) => {
        await network.provider.send("evm_increaseTime", [time]);
        await network.provider.request({method: "evm_mine", params: []});
    };

    describe("Constructor", () => {
        it("Initializes the contract correctly", async () => {
            const raffleState = await raffle.getRaffleState();
            const keepersUpdateInterval = await raffle.getInterval();

            assert.equal(RaffleState.OPEN, raffleState);
            assert.equal(networkConfig[chainId].keepersUpdateInterval, keepersUpdateInterval.toNumber());
        });
    });

    describe("Enter Raffle", () => {
        it("should be able to enter when paying proper fee", async () => {
            let fee = entranceFee.add(1);

            const tx = await raffle.connect(player1).enterRaffle({value: fee});
            expect(tx).to.emit(raffle, "PlayerAdded").withArgs(player1.address, 0);
        });
        it("should revert when not enough fee provided", async () => {
            let fee = entranceFee.sub(1);

            const tx = raffle.connect(player1).enterRaffle({value: fee});
            await expect(tx).to.be.revertedWithCustomError(raffle, "Raffle__entranceFeeNotMet");
        });
    });

    describe("CheckUpkeep", () => {
        beforeEach(async () => {
            console.log(`CheckUpkeep beforeEach..`);
        });
        it("should fail when no players", async () => {
            await increaseTime(interval + 1);
            const playerCount = await raffle.getNumberOfPlayers();

            assert.equal(0, playerCount.toNumber());
            // callStatic: prevent state change, and return the result
            const {upkeepNeeded} = await raffle.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
            assert(!upkeepNeeded);
        });

        it("should fail when enough time hasn't passed", async () => {
            let fee = entranceFee.add(1);
            const tx = await raffle.connect(player1).enterRaffle({value: fee});
            const playerCount = await raffle.getNumberOfPlayers();
            await increaseTime(interval - 5); // keep time short of `interval` period
            const {upkeepNeeded} = await raffle.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
            const state = await raffle.getRaffleState();

            assert.equal(1, playerCount.toNumber()); // we have a player and funds
            assert.equal(state, RaffleState.OPEN); // state is also open
            assert(!upkeepNeeded); // although we have players and funds, time prevents upkeep
        });

        it("should fail when raffle isn't open", async () => {
            await raffle.connect(player1).enterRaffle({value: entranceFee.add(1)});
            await increaseTime(interval + 5);
            await raffle.performUpkeep([]); // changes the state to calculating

            const state = await raffle.getRaffleState();
            const {upkeepNeeded} = await raffle.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)

            assert.equal(state, RaffleState.CALCULATING); // state is also open
            assert(!upkeepNeeded); // RaffleState.CALCULATING prevents upkeep
        });

        it("should pass when time, players & funds conditions met", async () => {
            await raffle.connect(player1).enterRaffle({value: entranceFee.add(1)});
            await increaseTime(interval + 5);

            const {upkeepNeeded} = await raffle.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
            assert(upkeepNeeded); // players + funds present, time also passed, hence should pass
        });
    });

    describe("Perform Upkeep", () => {
        it("should revert if checkUpkeep returns false", async () => {
            const tx = raffle.performUpkeep("0x");
            await expect(tx).to.be.revertedWithCustomError(raffle, "Raffle__UpkeepNotNeeded");
        });

        it("should run if checkUpkeep returns true", async () => {
            await raffle.connect(player1).enterRaffle({value: entranceFee.add(1)});
            await increaseTime(interval + 5);
            const tx = raffle.performUpkeep("0x");

            await expect(tx).to.emit(raffle, "RequestedRaffleWinner");
            const state = await raffle.getRaffleState();
            assert.equal(state, RaffleState.CALCULATING);
        });
    });
});
