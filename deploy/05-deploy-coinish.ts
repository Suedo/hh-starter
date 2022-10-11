import {HardhatRuntimeEnvironment} from "hardhat/types";
import {Basic} from "../typechain-types/contracts/Basic";

/**
 * hre: HardhatRuntimeEnvironment is injected by hardhat-deploy
 */
module.exports = async (hre: HardhatRuntimeEnvironment) => {
  const {ethers} = hre;

  const localHHNodeUrl = "http://127.0.0.1:8545";

  let accounts = await ethers.getSigners();

  /* hardhat node
    Account #4: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 (10000 ETH)
    Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a */
  let key_deployingAccount = "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a";

  const Basic = await ethers.getContractFactory("Basic");
  const provider = new ethers.providers.JsonRpcProvider(localHHNodeUrl);
  const wallet = new ethers.Wallet(key_deployingAccount, provider);

  const deployTx = Basic.getDeployTransaction([1]);
  const tx = await wallet.populateTransaction(deployTx); // nonce added, among other things
  // tx.value = ethers.utils.parseEther("1"); // WHY data too big ??!!

  console.log("populatedTransaction: ", tx);
  console.log("Wallet: " + wallet.address);

  // https://github.com/ethers-io/ethers.js/issues/1869
  // const signedTx = await signer.signTransaction(tx);

  const signedTx = await wallet.signTransaction(tx); // in COIN, this would be unbound sign

  const response = await provider.sendTransaction(signedTx);
  const receipt = await response.wait();
  const address = receipt.contractAddress;
  const basic = (await ethers.getContractAt("Basic", address, wallet)) as Basic;
  console.log("Receipt : ", address, " , contract: ", basic.address);
  console.log("Basic's starting counter: ", await basic.getCounter());

  // ------------- ^ the deploy part works, but below balance keeps returning 0 value ---------

  await accounts[0].sendTransaction({
    to: address,
    value: ethers.utils.parseEther("0.1"),
  });

  // ^^ giving wallet in the 3rd argument is needed, else it will consider some default signer,
  // which will cause error because the contract was not deployed using a default signer

  const ownerAddress = await basic.owner();
  console.log("Basic's owner: ", ownerAddress);

  // WHY coming as 0 always
  console.log("Basic's owner balance: ", (await basic.getBalanceOf(ownerAddress)).toString());
};

module.exports.tags = ["all", "COIN"];
