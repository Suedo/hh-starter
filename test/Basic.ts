// THIS FAILS, TRYING TO CONNECT TO HH NODE CONTRACT FAILS
// TRY VIA SCRIPTS

import hre, {ethers} from "hardhat";
import {Basic} from "../typechain-types";

describe("Basic", function () {
  let basic: Basic;
  let ethers;

  before(async () => {
    ethers = hre.ethers;
    basic = (await ethers.getContractAt("Basic", "0x78e6B135B2A7f63b281C80e2ff639Eed32E2a81b")) as Basic;
  });

  it("should have deployed correctly", async () => {
    const c = await basic.getCounter();
    console.log("Counter: ", c.toNumber());
  });
  it("should have some balance", async () => {
    const ownerBalance = await basic.getBalance();
    console.log("Owner balance: ", ownerBalance);
  });
  // it("should show increased owner balance when funds sent to it", async () => {});
});

/*

should have deployed correctly:
Error: call revert exception [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] 
(method="getCounter()", data="0x", errorArgs=null, errorName=null, errorSignature=null, reason=null, code=CALL_EXCEPTION, version=abi/5.7.0)

should have some balance:
Error: call revert exception [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] 
(method="getBalance()", data="0x", errorArgs=null, errorName=null, errorSignature=null, reason=null, code=CALL_EXCEPTION, version=abi/5.7.0)

*/
