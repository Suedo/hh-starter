import {anyValue} from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {assert, expect, util} from "chai";
import {network, deployments, ethers, getNamedAccounts} from "hardhat";
import {Allowance} from "../typechain-types/contracts/Allowance";

describe("Allowance", () => {
    let allowance: Allowance;
    let deployer;
    let accounts: SignerWithAddress[];
    let kid1: string;
    const allowanceAmt = 50,
        allowanceLimit = 100;

    // this maps solidity enum ChangeType
    let ChangeType = {
        None: 0,
        Increase: 1,
        Decrease: 2,
    };

    /**
     * Before : this runs only once. thus, successive tests will be exposed
     * to state change of a contract from the previous test.
     * This is what we want here, else we would have needed to repeat a lot of steps in each test
     */
    before(async () => {
        // const accounts = await ethers.getSigners()
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["old"]);
        allowance = await ethers.getContract("Allowance", deployer);
        accounts = await ethers.getSigners();
        kid1 = accounts[1].address;

        // https://ethereum.stackexchange.com/a/102559/22522
        await accounts[0].sendTransaction({
            to: allowance.address,
            value: ethers.utils.parseEther("1"),
        });
    });

    it("should add a new dependent", async () => {
        const tx = await allowance.addDependent(kid1);
        await expect(tx).to.emit(allowance, "DependentAdded").withArgs(kid1);
    });

    it("should increase allowance limit", async () => {
        const tx2 = await allowance.changeAllowanceLimit(kid1, allowanceLimit, ChangeType.Increase);

        await expect(tx2)
            .to.emit(allowance, "AllowanceLimitChange")
            .withArgs(kid1, allowanceLimit, ChangeType.Increase, allowanceLimit);
    });

    it("owner should be able to give allowance to added dependents", async () => {
        // https://stackoverflow.com/a/72360798/2715083
        // if a tx returns a value, we need to either check it via event,
        // or have a separate view function to get the latest updated value
        const tx3 = await allowance.giveAllowance(kid1, allowanceAmt);
        await expect(tx3)
            .to.emit(allowance, "AllowanceChange")
            .withArgs(kid1, allowanceLimit, ChangeType.Increase, allowanceAmt);

        // https://hardhat.org/tutorial/testing-contracts#using-a-different-account
        const balance = await allowance.connect(accounts[1]).getBalance();
        assert.equal(allowanceAmt, balance.toNumber());
    });

    it("dependent should be able to withdraw allowance", async () => {
        // allowance = 50, should be able to withdraw < 50
        const tx4 = await allowance.connect(accounts[1]).withdraw(30);

        await expect(tx4).to.emit(allowance, "Transferred").withArgs(anyValue, kid1, 30);
        const balanceAfterWithdraw = await allowance.connect(accounts[1]).getBalance();

        // balance was 50, we withdrew 30, so we should have 20 left
        assert.equal(20, balanceAfterWithdraw.toNumber());
    });

    it("should fail when trying to withdraw more funds than it has", async () => {
        const moreFundsThanItHas = 500; // only has 20
        const connectedContract = allowance.connect(accounts[1]);

        // prettier-ignore
        await expect(connectedContract.withdraw(moreFundsThanItHas))
            .to.be.revertedWith("Not enough Funds");
    });

    it("should fail when random person tries to withdraw funds", async () => {
        // only accounts[1]'s address is added as dependent
        const connectedContract = allowance.connect(accounts[2]);

        // prettier-ignore
        await expect(connectedContract.withdraw(5))
            .to.be.revertedWith("Dependent not added");
    });
});
