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


## Solidity Coverage

After `import "solidity-coverage";`, you can run `hardhat coverage` and get report as below:


```
-------------------------------|----------|----------|----------|----------|----------------|
File                           |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-------------------------------|----------|----------|----------|----------|----------------|
 contracts/                    |    59.65 |    40.91 |    57.69 |    58.24 |                |
  Allowance.sol                |    89.47 |    55.56 |    85.71 |    86.21 |    44,60,61,65 |
  CrowdFundingWithDeadline.sol |        0 |        0 |       20 |    31.25 |... 40,41,42,43 |
  Crud.sol                     |      100 |       50 |      100 |      100 |                |
  Lock.sol                     |      100 |      100 |      100 |      100 |                |
  Lottery.sol                  |        0 |        0 |    16.67 |     4.35 |... 53,54,55,56 |
  SimpleStorage.sol            |      100 |      100 |        0 |        0 |              8 |
-------------------------------|----------|----------|----------|----------|----------------|
All files                      |    59.65 |    40.91 |    57.69 |    58.24 |                |
-------------------------------|----------|----------|----------|----------|----------------|
```