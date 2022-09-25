import {BigNumber} from "ethers";
import {ethers} from "hardhat";

type Network = {
    name: string;
    keepersUpdateInterval: number;
    subscriptionId?: string;
    gasLane?: string;
    raffleEntranceFee: BigNumber;
    callbackGasLimit?: string;
    vrfCoordinatorV2?: string;
};

type NetworkConfig = {
    [key: number]: Network;
};

const networkConfig: NetworkConfig = {
    31337: {
        name: "localhost",
        subscriptionId: "588",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // doesnt matter
        keepersUpdateInterval: 30,
        raffleEntranceFee: ethers.utils.parseEther("0.01"),
        callbackGasLimit: "500000", // 500,000 gas
    },
    4: {
        name: "goerli",
        subscriptionId: "6926",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // 30 gwei
        keepersUpdateInterval: 30,
        raffleEntranceFee: ethers.utils.parseEther("0.01"),
        callbackGasLimit: "500000", // 500,000 gas
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    },
    1: {
        name: "mainnet",
        keepersUpdateInterval: 30,
        raffleEntranceFee: ethers.utils.parseEther("0.01"),
    },
};

const developmentChains = ["hardhat", "localhost"];
const VERIFICATION_BLOCK_CONFIRMATIONS = 6;
const frontEndContractsFile = "../nextjs-smartcontract-lottery-fcc/constants/contractAddresses.json";
const frontEndAbiFile = "../nextjs-smartcontract-lottery-fcc/constants/abi.json";

export {networkConfig, developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS, frontEndContractsFile, frontEndAbiFile};
