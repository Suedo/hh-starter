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

    beforeEach(async () => {
        accounts = await ethers.getSigners();
        player1 = accounts[1];
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["raffle", "mocks"]);
        raffle = await ethers.getContract("Raffle", deployer);
        chainId = network.config.chainId || 31337;
        entranceFee = networkConfig[chainId].raffleEntranceFee;
    });

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
            let fee = await raffle.getEntranceFee();
            fee = fee.add(1);

            const tx = await raffle.connect(player1).enterRaffle({value: fee});
            expect(tx).to.emit(raffle, "PlayerAdded").withArgs(player1.address, 0);
        });
    });
});
