import {HardhatRuntimeEnvironment} from "hardhat/types";

module.exports = async (hre: HardhatRuntimeEnvironment) => {
    const {ethers, getNamedAccounts, deployments} = hre;
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();

    const deployArgs = {from: deployer, log: true, waitConfirmations: 1};
    const raffleEntranceFee = ethers.utils.parseUnits("1.0", "gwei");

    log("-".repeat(80));
    log("Deploying contracts...");

    // here we deploy in hardhat-deploy-ethers induced style
    // benefit being, deployments will be kept track of in tests as well
    const crud = await deploy("Crud", {from: deployer});
    log(`Crud deployed at ${crud.address}`);

    const lottery = await deploy("Lottery", deployArgs);
    log(`Lottery deployed at ${lottery.address}`);

    const allowance = await deploy("Allowance", deployArgs);
    log(`Allowance deployed at ${allowance.address}`);

    const accounts = await ethers.getSigners();
    log(`accounts[1]: ${accounts[1].address}`);
    const crowdFundingWithDeadline = await deploy("CrowdFundingWithDeadline", {
        from: deployer,
        args: ["funding", 1, 10, accounts[1].address],
    });
    log(`CrowdFundingWithDeadline deployed at ${crowdFundingWithDeadline.address}`);
};

module.exports.tags = ["all", "old"];
