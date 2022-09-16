import {HardhatRuntimeEnvironment} from "hardhat/types";

/**
 * hre: HardhatRuntimeEnvironment is injected by hardhat-deploy
 */
module.exports = async (hre: HardhatRuntimeEnvironment) => {
    const {ethers, getNamedAccounts, deployments} = hre;
    const currentTimestampInSeconds = Math.round(Date.now() / 1000);
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

    const lockedAmount = ethers.utils.parseEther("1");

    // here we deploy in vanilla hardhat style
    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, {value: lockedAmount});

    await lock.deployed();

    console.log(`Lock with 1 ETH and unlock timestamp ${unlockTime} deployed to ${lock.address}`);
};

module.exports.tags = ["all", "default"];
