# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
GAS_REPORT=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```

#Notes

## Abi Coder

Modern versions of solidity uses abi encoder v2 by default: [docs](https://docs.soliditylang.org/en/v0.8.17/layout-of-source-files.html?highlight=ABIEncoderv2#abi-coder-pragma)

> It is considered non-experimental as of Solidity 0.6.0 and it is enabled by default starting with Solidity 0.8.0

As such, we no longer need to define it explicitly in our code
