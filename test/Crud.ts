import {assert, expect} from "chai";
import {BigNumber} from "ethers";
import {network, deployments, ethers, getNamedAccounts} from "hardhat";
import {Crud} from "../typechain-types/contracts/Crud";

describe("Crud", () => {
    let crud: Crud;
    let deployer;

    // this maps solidity enum ChangeType
    let ChangeType = {
        Create: 0,
        Update: 1,
        Delete: 2,
    };
    // const sendValue = ethers.utils.parseEther("1");
    beforeEach(async () => {
        // const accounts = await ethers.getSigners()
        // deployer = accounts[0]
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["old"]);
        crud = await ethers.getContract("Crud", deployer);
    });

    it("should create a new user with id 1", async () => {
        const tx = await crud.createUser("luffy");
        const user = await crud.findUserById(1);

        await expect(tx).to.emit(crud, "StateChanged").withArgs(1, "luffy", ChangeType.Create);

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

    it("should emit event when deleted", async () => {
        await crud.createUser("luffy");
        await expect(await crud.deleteUserById(1))
            .to.emit(crud, "StateChanged")
            .withArgs(1, "luffy", ChangeType.Delete);
    });
});

// https://eduardowronscki.hashnode.dev/how-to-write-type-safe-tests-for-your-solidity-smart-contracts-with-typescript-and-typechain#heading-adding-typechain

// command to execute test:
// hardhat test test/Crud.ts
// hardhat test test/Crud.ts --grep "create a new user with id 1" // to run a test by its name
// https://youtu.be/gyMwXuJrbJQ?t=42201
