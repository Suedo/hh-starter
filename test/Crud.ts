import {assert, expect} from "chai";
import {network, deployments, ethers, getNamedAccounts} from "hardhat";
import {Crud} from "../typechain-types/contracts/Crud";

describe("Crud", () => {
    let crud: Crud;
    let deployer;
    // const sendValue = ethers.utils.parseEther("1");
    beforeEach(async () => {
        // const accounts = await ethers.getSigners()
        // deployer = accounts[0]
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["old"]);
        crud = await ethers.getContract("Crud", deployer);
    });

    it("should create a new user with id 1", async () => {
        // arrange
        await crud.createUser("luffy");
        // act
        const user = await crud.findUserById(1);
        // assert
        assert.equal(1, user[0].toNumber());
        assert.equal("luffy", user[1]);
    });

    it("should update a user", async () => {
        await crud.createUser("luffy");
        await crud.updateUser(1, "Robin");
        const user = await crud.findUserById(1);

        assert.equal(1, user[0].toNumber());
        assert.equal("Robin", user[1]);
    });

    it("should revert when trying to update non-existing record", async () => {
        await expect(crud.updateUser(2, "Robin")).to.be.revertedWithCustomError(crud, "CRUD__UserNotFound");
    });
});

// https://eduardowronscki.hashnode.dev/how-to-write-type-safe-tests-for-your-solidity-smart-contracts-with-typescript-and-typechain#heading-adding-typechain
// hardhat test test/Crud.ts
