import {anyValue} from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import {assert, expect} from "chai";
import {Contract} from "ethers";
import {FunctionFragment} from "ethers/lib/utils";
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
        console.log("-".repeat(120));
    });

    after(async () => {
        let a = `${"-".repeat(54)} Done `;
        let b = "-".repeat(120 - a.length);
        console.log("\n" + a + b);
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

        // console.log("Receipt: ");
        // console.log(receipt);

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

    it("should properly delegateCall the Callee when invoking from dapp layer directly", async () => {
        const delegateCallee = tester;
        const delegateCaller = caller;
        const val = ethers.utils.parseEther("0.1");

        let callerValue = await caller.value();
        let callerNum = await caller.num();
        const testerNum = await tester.num();

        assert.equal(callerNum.toNumber(), 0, "'num' Values should be zero before execution");
        assert.equal(callerValue.toNumber(), 0, "'value' Values should be zero before execution");

        let functionToCall = delegateCallee.interface.encodeFunctionData("setVars", [42]);
        const tx = delegateCaller.setVarsCalldata(delegateCallee.address, functionToCall, {value: val});
        // let tx = await delegateCaller.set(cut, diamondInit.address, initFunctionCall);

        await expect(tx).to.emit(delegateCaller, "CallerEvent").withArgs(anyValue, 1, delegateCallee.address);

        callerValue = await caller.value();
        callerNum = await caller.num();

        // since delegateCall, Caller's state is used, and modified
        assert.equal(callerNum.toNumber(), 42);
        assert.equal(callerValue.toString(), val.toString()); // cannot directly compare to BigNumbers
        assert.equal(testerNum.toNumber(), 0);
    });
});
