import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {network, deployments, ethers, getNamedAccounts} from "hardhat";
import {Raffle} from "../typechain-types/contracts/Raffle";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {assert, expect} from "chai";

describe("Raffle", () => {
    let raffle: Raffle;
    let entranceFee = ethers.utils.parseUnits("1.0", "gwei");
    let deployer;
    let accounts: SignerWithAddress[];

    // native hardhat way
    async function deployRaffle1Gwei() {
        const Raffle = await ethers.getContractFactory("Raffle");
        const raffleEntranceFee = ethers.utils.parseUnits("1.0", "gwei");

        const contract = (await Raffle.deploy(raffleEntranceFee)) as Raffle;
        return {contract, raffleEntranceFee};
    }

    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        accounts = await ethers.getSigners();
        // await deployments.fixture(["old"]);
        // raffle = await ethers.getContract("Raffle", deployer);
        const {contract, raffleEntranceFee} = await loadFixture(deployRaffle1Gwei);
        raffle = contract;
    });

    it("should deploy Raffle with 1 GWEI entrance fee", async () => {
        const fee = await raffle.getEntranceFee();
        assert.equal(entranceFee.toString(), fee.toString());
    });

    it("should add a player to array and emit event", async () => {
        // accounts have ether loaded by default in the hardhat runtime env
        const tx = await raffle.connect(accounts[1]).enterRaffle({value: ethers.utils.parseUnits("2.0", "gwei")});

        // 1st player got added, the index position should be 0
        await expect(tx).to.emit(raffle, "PlayerAdded").withArgs(accounts[1].address, 0);
    });
});
