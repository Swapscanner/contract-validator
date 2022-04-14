const solc = require('solc');

module.exports = async ({ optimize, optimizeRuns, evmVersion, version, source } = {}) => {
  console.log(`loading solc ${version}`);
  const snapshot = await new Promise((resolve, reject) =>
    solc.loadRemoteVersion(version, (err, snapshot) => (err ? reject(err) : resolve(snapshot))),
  );
  console.log(`solc ${version} fetched`);

  const {
    contracts: { 'main.sol': contracts },
  } = JSON.parse(
    await snapshot.compile(
      JSON.stringify({
        language: 'Solidity',
        settings: {
          optimizer: {
            enabled: optimize,
            runs: optimizeRuns,
          },
          evmVersion,
          outputSelection: {
            '*': {
              '*': ['*'],
            },
          },
        },
        sources: {
          'main.sol': {
            content: source,
          },
        },
      }),
    ),
  );

  let contractName;
  let constructorABI;
  let bytecode = '';

  Object.entries(contracts).forEach(
    ([
      name,
      {
        abi,
        evm: {
          bytecode: { object },
        },
      },
    ]) => {
      if (bytecode.length < object.length) {
        constructorABI = abi.find((o) => o.type === 'constructor')?.inputs ?? [];
        bytecode = object;
        contractName = name;
      }
    },
  );

  return { name: contractName, bytecode, constructorABI };
};
