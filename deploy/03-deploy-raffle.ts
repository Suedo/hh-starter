import {HardhatRuntimeEnvironment} from "hardhat/types";
import {network} from "hardhat";
import {networkConfig, developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS} from "../helper-hardhat-config";

module.exports = async (hre: HardhatRuntimeEnvironment) => {
    const {ethers, getNamedAccounts, deployments} = hre;
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId || 31337;
    let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock;

    const FUND_AMOUNT = ethers.utils.parseEther("1.0");

    log("-".repeat(80));
    log(`Deploying contracts to ${network.name} with chainId ${chainId}`);

    if (chainId == 31337) {
        // create VRFV2 Subscription
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        log(`VRF Coordinator address: ${vrfCoordinatorV2Address}`);

        // send a tx, get response, wait on response for tx to complete on chain
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
        const transactionReceipt = await transactionResponse.wait();

        subscriptionId = transactionReceipt.events[0].args.subId;

        // Fund the subscription
        // Our mock makes it so we don't actually have to worry about sending fund
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
    }

    log(`NetworkConfig[${chainId}]: ${JSON.stringify(networkConfig[chainId], null, 2)}`);

    const raffleArgs = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].keepersUpdateInterval,
        networkConfig[chainId].raffleEntranceFee,
        networkConfig[chainId].callbackGasLimit,
    ];

    const raffle = await deploy("Raffle", {
        from: deployer,
        args: raffleArgs,
        log: true,
        waitConfirmations: 1,
    });
    log(`Raffle deployed at ${raffle.address}`);
};

module.exports.tags = ["all", "raffle"];

/*

hh deploy
-----------------------------------------------------------------

Deploying contracts to hardhat with chainId 31337
VRF Coordinator address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
NetworkConfig[31337]: {
  "name": "localhost",
  "subscriptionId": "588",
  "gasLane": "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
  "keepersUpdateInterval": "30",
  "raffleEntranceFee": {
    "type": "BigNumber",
    "hex": "0x2386f26fc10000"
  },
  "callbackGasLimit": "500000"
}
deploying "Raffle" (tx: 0xa0019ce209367269b1ef9481ca518f6105e415d892c39c4e2809f8dfe60de8fb)...: deployed at 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6 with 1477351 gas
Raffle deployed at 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
*/
