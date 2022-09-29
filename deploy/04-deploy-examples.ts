import {network} from "hardhat";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {developmentChains} from "../helper-hardhat-config";

module.exports = async (hre: HardhatRuntimeEnvironment) => {
    const {getNamedAccounts, deployments} = hre;
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();

    const chainId = network.config.chainId;
    const networkName = network.name;

    const deployArgs = {
        from: deployer,
        log: false,
        waitConfirmations: 1,
    };
    log("-".repeat(80));

    console.log(`Deploying to network: ${networkName} having chainId: ${chainId}`);
    if (developmentChains.includes(networkName)) {
        await deploy("Tester", deployArgs);
        await deploy("Caller", deployArgs);

        console.log("Deployment completed.");
    } else {
        console.log(`Skipping.. only to be deployed in local networks!`);
    }
};

module.exports.tags = ["all", "examples"];
