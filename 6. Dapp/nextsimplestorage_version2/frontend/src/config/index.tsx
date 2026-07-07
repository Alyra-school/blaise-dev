import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { hardhat } from '@reown/appkit/networks'

// Get projectId from https://dashboard.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [hardhat]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig

export const CONTRACT_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_ABI=[
    {
      "inputs": [],
      "name": "NumberTooBig",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "by",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "number",
          "type": "uint256"
        }
      ],
      "name": "NumberChanged",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "getMyNumber",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_myNumber",
          "type": "uint256"
        }
      ],
      "name": "setMyNumber",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]