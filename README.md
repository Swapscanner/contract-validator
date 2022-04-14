# contract-validator

## Problem definition

We have figured out that multiple team that are trying to validate deployed bytecode with given Solidity code in following method:

- Get Solidity code from the contract deployer.
- Collect the `solc` parameters that the deployer used during compilation (mainly `evmVersion`, `optimizer`, and `optimizeRuns`).
- Run `solc` with the same parameters.
- Fetch the deployed bytecode from Web3 provider by invoking `eth_getCode`.
- Compare the deployed bytecode with `solc` generated "deployed bytecode".

However this method may resulting failing validation in certain cases. One we have figured out is when the given contract tries to set `immutable` variable on `constructor` method, which will update the deployed bytecode directly, during the deployment.

For instance:

```solidity
contract ProofOfConcept {
  uint256 private immutable problematic;

  constructor(uint256 _problematic) {
    problematic = _problematic;
  }
}
```

The `solc` returned "deployed bytecode" will set `00000...` as a placeholder for `problematic` variable, since it is not actually running the `constructor` during it's generation.

However, when the contract is being deployed, `constructor` will be invoked with it's given parameter, and mutate the "deployed bytecode" itself.

This results in the validation method provided above, always derive failure in validation.

## Suggested validation method

We are suggesting validators to do the followings instead:

- Get Solidity code from the contract deployer.
- Collect the `solc` parameters.
- **Also collect their constructor arguments (parameters) as well.**
- Run `solc` to derive the `bytecode`, not the "deployed bytecode".
- Run the EVM to simulate the "actual" bytecode, using the collected constructor arguments.
- Fetch the "expected" bytecode from Web3 provider by invoking `eth_getCode`.
- Compare the "expected" with "actual".

## Usage of this PoC

```
contract-validator $ npm ci
contract-validator $ ./bin/validate --help
Usage: validate [options]

Options:
  --optimize                             enable bytecode optimizer (default: true)
  --optimize-runs <optimize-runs>        number of optimizer runs (default: 4294967295)
  --evm-version <evm-version>            evm version (default: "constantinople")
  --solc-version <solc-version>          solidity compiler solc version (default: "v0.8.10+commit.fc410830")
  --contract-address <contract-address>  address of the contract to be verified (default: "0x8888888888885b073f3c81258c27e83db228d5f3")
  --source <source-path>                 path to the sourcecode (flattened)
  --constructor-args <args>              comma-separated list of constructor args
  -h, --help                             display help for command
```

Example validation run:

```bash
# Specify the Web3 provider URL
$ PROVIDER=http://ken.internal.blockswords:8551 \
  ./bin/validate \
  --source ./fixtures/Swapscanner.sol \
  --constructor-args Swapscanner,SCNR,8217

loading solc v0.8.10+commit.fc410830
solc v0.8.10+commit.fc410830 fetched
validating contract Swapscanner deployed on 0x8888888888885b073f3c81258c27e83db228d5f3
validation status: true
```
