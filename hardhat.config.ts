import { HardhatUserConfig } from 'hardhat/config'
import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-ethernal'
import '@openzeppelin/hardhat-upgrades'



const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true,
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.TEST_ACCOUNT_KEY as string],
    },
    polygon_testnet: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.TEST_ACCOUNT_KEY as string],
      gasPrice: 8000000000
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      accounts: [
        // Publicly known private key of public account
        process.env.LOCALHOST_TESTING_KEY as string
      ],
      gasPrice: 'auto',
      gas: 'auto',
      chainId: 1337,
      allowUnlimitedContractSize: true,
    },
    optimism_goerli: {
      url: "https://goerli.optimism.io",
      chainId: 420,
      accounts: [
        process.env.TEST_ACCOUNT_KEY_2 as string
      ]
    },
  },
  ethernal: {
    apiToken: process.env.ETHERNAL_API_TOKEN,
    disableSync: false, // If set to true, plugin will not sync blocks & txs
    disableTrace: false, // If set to true, plugin won't trace transaction
    workspace: undefined, // Set the workspace to use, will default to the default workspace (latest one used in the dashboard). It is also possible to set it through the ETHERNAL_WORKSPACE env variable
    uploadAst: false, // If set to true, plugin will upload AST, and you'll be able to use the storage feature (longer sync time though)
    disabled: false, // If set to true, the plugin will be disabled, nohting will be synced, ethernal.push won't do anything either
    serverSync: false, // Only available on public explorer plans - If set to true, blocks & txs will be synced by the server. For this to work, your chain needs to be accessible from the internet. Also, trace won't be synced for now when this is enabled.
    skipFirstBlock: false, // If set to true, the first block will be skipped. This is mostly useful to avoid having the first block synced with its tx when starting a mainnet fork
    verbose: false, // If set to true, will display this config object on start and the full error object
    resetOnStart: 'Hardhat'
  }
}

export default config
