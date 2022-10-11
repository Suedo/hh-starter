// This runs

import hre from "hardhat";
import {Basic} from "../typechain-types";

async function main() {
  const ethers = hre.ethers;

  const localHHNodeUrl = "http://127.0.0.1:8545";
  const provider = new ethers.providers.JsonRpcProvider(localHHNodeUrl);

  const basic = (await ethers.getContractAt(
    "Basic",
    "0x78e6B135B2A7f63b281C80e2ff639Eed32E2a81b",
    provider.getSigner() // this is key info
  )) as Basic;

  const c = await basic.getCounter();
  console.log("Counter: ", c.toNumber());

  const owner = await basic.owner();
  console.log("Owner: ", owner);

  const ownerBalance = await basic.getBalanceOf(owner);
  console.log("Owner balance: ", ethers.utils.formatUnits(ownerBalance, "ether"));
  // it("should show increased owner balance when funds sent to it", async () => {});
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
