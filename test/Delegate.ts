import {anyValue} from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import {assert, expect} from "chai";
import {deployments, ethers, getNamedAccounts} from "hardhat";
import {Caller, Tester} from "../typechain-types";

describe("Delegate Call", () => {
    let deployer: string;
    let caller: Caller, tester: Tester;

    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["examples"]);
        caller = await ethers.getContract("Caller", deployer);
        tester = await ethers.getContract("Tester", deployer);
    });

    it("should have default values at start", async () => {
        const callerNum = await caller.num();
        const testerNum = await tester.num();

        assert.equal(callerNum.toNumber(), 0);
        assert.equal(testerNum.toNumber(), 0);
    });

    it("caller should have values set after delegate call to Tester", async () => {
        const testerAddress = tester.address;
        const callerAdress = caller.address;

        console.log(`Caller: ${callerAdress}, Tester: ${testerAddress}, deployer: ${deployer}`);

        const tx = caller.setVars(testerAddress, 123, {value: ethers.utils.parseEther("0.01")});
        await expect(tx).to.emit(caller, "CallerEvent").withArgs(anyValue, 123, testerAddress);

        const callerNum = await caller.num();
        const testerNum = await tester.num();

        // since delegateCall, Caller's state is used, and modified
        assert.equal(callerNum.toNumber(), 123);
        assert.equal(testerNum.toNumber(), 0);
    });

    // https://stackoverflow.com/a/72968114/2715083
    it("event in delegateCallee should be logged with Caller's address", async () => {
        // just for better readability
        const delegateCallee = tester;
        const delegateCaller = caller;

        const val = ethers.utils.parseEther("0.01");

        console.log(`Caller: ${delegateCaller.address}, Tester: ${delegateCallee.address}, deployer: ${deployer}`);

        const delegateCallTx = await delegateCaller.setVars(delegateCallee.address, 123, {value: val});
        const receipt = await delegateCallTx.wait();

        console.log("Receipt: ");
        console.log(receipt);

        const eventsUnderDelegateCaller = receipt.events?.find((e) => e.address === delegateCaller.address);

        let decodedEvent;
        if (!eventsUnderDelegateCaller) console.log("no events, skipping");
        else {
            decodedEvent = delegateCallee.interface.decodeEventLog(
                "TesterEvent",
                eventsUnderDelegateCaller.data,
                eventsUnderDelegateCaller.topics
            );
        }

        console.log("Decoded event");
        console.log(decodedEvent);

        expect(decodedEvent?.delegateCaller).to.equal(deployer);
        expect(decodedEvent?.value).to.equal(val);
        // .to.emit(tester, "TesterEvent")
        // .withArgs(123, deployer, ethers.utils.parseEther("0.01"));
        // msg.sender wrt Caller is deployer
        // Caller is delegateCalling to Tester, so event emitted at Tester will have Caller's context
    });
});
