import antevortaGold from "./AntevortaGold.json";

// Contract addresses
const ANTEVORTA_GOLD_ADDRESS = process.env.NEXT_PUBLIC_ANTEVORTA_GOLD_ADDRESS;
const NETWORK = process.env.NEXT_PUBLIC_NETWORK || "base_sepolia";

// Seaport addresses (official deployments) - BASE SEPOLIA ONLY
const SEAPORT_ADDRESSES = {
  base_sepolia: "0x0000000000000068F116a894984e2DB1123eB395", // Seaport 1.6
  localhost: "0x0000000000000068F116a894984e2DB1123eB395"
};

// Export AntevortaGold contract info
export const AntevortaGoldAddress = ANTEVORTA_GOLD_ADDRESS;
export const AntevortaGoldABI = antevortaGold.abi;

// Export Seaport contract info
export const SeaportAddress = SEAPORT_ADDRESSES[NETWORK];

// Seaport ABI (minimal interface for key functions)
export const SeaportABI = [
  // fulfillBasicOrder - for simple NFT purchases
  {
    "inputs": [
      {
        "components": [
          { "name": "considerationToken", "type": "address" },
          { "name": "considerationIdentifier", "type": "uint256" },
          { "name": "considerationAmount", "type": "uint256" },
          { "name": "offerer", "type": "address" },
          { "name": "zone", "type": "address" },
          { "name": "offerToken", "type": "address" },
          { "name": "offerIdentifier", "type": "uint256" },
          { "name": "offerAmount", "type": "uint256" },
          { "name": "basicOrderType", "type": "uint8" },
          { "name": "startTime", "type": "uint256" },
          { "name": "endTime", "type": "uint256" },
          { "name": "zoneHash", "type": "bytes32" },
          { "name": "salt", "type": "uint256" },
          { "name": "offererConduitKey", "type": "bytes32" },
          { "name": "fulfillerConduitKey", "type": "bytes32" },
          { "name": "totalOriginalAdditionalRecipients", "type": "uint256" },
          { "name": "additionalRecipients", "type": "tuple[]", "components": [
            { "name": "amount", "type": "uint256" },
            { "name": "recipient", "type": "address" }
          ]},
          { "name": "signature", "type": "bytes" }
        ],
        "name": "parameters",
        "type": "tuple"
      }
    ],
    "name": "fulfillBasicOrder",
    "outputs": [{ "name": "fulfilled", "type": "bool" }],
    "stateMutability": "payable",
    "type": "function"
  },
  // fulfillOrder - for standard orders
  {
    "inputs": [
      { "name": "order", "type": "tuple", "components": [
        { "name": "parameters", "type": "tuple", "components": [
          { "name": "offerer", "type": "address" },
          { "name": "zone", "type": "address" },
          { "name": "offer", "type": "tuple[]", "components": [
            { "name": "itemType", "type": "uint8" },
            { "name": "token", "type": "address" },
            { "name": "identifierOrCriteria", "type": "uint256" },
            { "name": "startAmount", "type": "uint256" },
            { "name": "endAmount", "type": "uint256" }
          ]},
          { "name": "consideration", "type": "tuple[]", "components": [
            { "name": "itemType", "type": "uint8" },
            { "name": "token", "type": "address" },
            { "name": "identifierOrCriteria", "type": "uint256" },
            { "name": "startAmount", "type": "uint256" },
            { "name": "endAmount", "type": "uint256" },
            { "name": "recipient", "type": "address" }
          ]},
          { "name": "orderType", "type": "uint8" },
          { "name": "startTime", "type": "uint256" },
          { "name": "endTime", "type": "uint256" },
          { "name": "zoneHash", "type": "bytes32" },
          { "name": "salt", "type": "uint256" },
          { "name": "conduitKey", "type": "bytes32" },
          { "name": "counter", "type": "uint256" }
        ]},
        { "name": "signature", "type": "bytes" }
      ]},
      { "name": "fulfillerConduitKey", "type": "bytes32" }
    ],
    "name": "fulfillOrder",
    "outputs": [{ "name": "fulfilled", "type": "bool" }],
    "stateMutability": "payable",
    "type": "function"
  },
  // cancel - for cancelling orders
  {
    "inputs": [{ "name": "orders", "type": "tuple[]", "components": [
      { "name": "offerer", "type": "address" },
      { "name": "zone", "type": "address" },
      { "name": "offer", "type": "tuple[]", "components": [
        { "name": "itemType", "type": "uint8" },
        { "name": "token", "type": "address" },
        { "name": "identifierOrCriteria", "type": "uint256" },
        { "name": "startAmount", "type": "uint256" },
        { "name": "endAmount", "type": "uint256" }
      ]},
      { "name": "consideration", "type": "tuple[]", "components": [
        { "name": "itemType", "type": "uint8" },
        { "name": "token", "type": "address" },
        { "name": "identifierOrCriteria", "type": "uint256" },
        { "name": "startAmount", "type": "uint256" },
        { "name": "endAmount", "type": "uint256" },
        { "name": "recipient", "type": "address" }
      ]},
      { "name": "orderType", "type": "uint8" },
      { "name": "startTime", "type": "uint256" },
      { "name": "endTime", "type": "uint256" },
      { "name": "zoneHash", "type": "bytes32" },
      { "name": "salt", "type": "uint256" },
      { "name": "conduitKey", "type": "bytes32" },
      { "name": "counter", "type": "uint256" }
    ]}],
    "name": "cancel",
    "outputs": [{ "name": "cancelled", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // getCounter - for getting current counter
  {
    "inputs": [{ "name": "offerer", "type": "address" }],
    "name": "getCounter",
    "outputs": [{ "name": "counter", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  // incrementCounter - for invalidating all current orders
  {
    "inputs": [],
    "name": "incrementCounter",
    "outputs": [{ "name": "newCounter", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // getOrderStatus
  {
    "inputs": [{ "name": "orderHash", "type": "bytes32" }],
    "name": "getOrderStatus",
    "outputs": [
      { "name": "isValidated", "type": "bool" },
      { "name": "isCancelled", "type": "bool" },
      { "name": "totalFilled", "type": "uint256" },
      { "name": "totalSize", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // getOrderHash - for computing order hash
  {
    "inputs": [{ "name": "order", "type": "tuple", "components": [
      { "name": "offerer", "type": "address" },
      { "name": "zone", "type": "address" },
      { "name": "offer", "type": "tuple[]", "components": [
        { "name": "itemType", "type": "uint8" },
        { "name": "token", "type": "address" },
        { "name": "identifierOrCriteria", "type": "uint256" },
        { "name": "startAmount", "type": "uint256" },
        { "name": "endAmount", "type": "uint256" }
      ]},
      { "name": "consideration", "type": "tuple[]", "components": [
        { "name": "itemType", "type": "uint8" },
        { "name": "token", "type": "address" },
        { "name": "identifierOrCriteria", "type": "uint256" },
        { "name": "startAmount", "type": "uint256" },
        { "name": "endAmount", "type": "uint256" },
        { "name": "recipient", "type": "address" }
      ]},
      { "name": "orderType", "type": "uint8" },
      { "name": "startTime", "type": "uint256" },
      { "name": "endTime", "type": "uint256" },
      { "name": "zoneHash", "type": "bytes32" },
      { "name": "salt", "type": "uint256" },
      { "name": "conduitKey", "type": "bytes32" },
      { "name": "counter", "type": "uint256" }
    ]}],
    "name": "getOrderHash",
    "outputs": [{ "name": "orderHash", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Network configurations - BASE SEPOLIA ONLY
const networks = {
  base_sepolia: {
    chainId: `0x${Number(84532).toString(16)}`,
    chainName: "Base Sepolia",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://sepolia.base.org"],
    blockExplorerUrls: ["https://sepolia.basescan.org"],
  },
  localhost: {
    chainId: `0x${Number(1337).toString(16)}`,
    chainName: "localhost",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["http://127.0.0.1:8545/"],
    blockExplorerUrls: [""],
  },
};

// Seaport Item Types
export const ItemType = {
  NATIVE: 0,  // ETH or native token
  ERC20: 1,
  ERC721: 2,
  ERC1155: 3,
  ERC721_WITH_CRITERIA: 4,
  ERC1155_WITH_CRITERIA: 5
};

// Seaport Order Types
export const OrderType = {
  FULL_OPEN: 0,
  PARTIAL_OPEN: 1,
  FULL_RESTRICTED: 2,
  PARTIAL_RESTRICTED: 3,
  CONTRACT: 4
};

// Basic Order Types for simple NFT sales
export const BasicOrderType = {
  ETH_TO_ERC721_FULL_OPEN: 0,
  ETH_TO_ERC721_PARTIAL_OPEN: 1,
  ETH_TO_ERC721_FULL_RESTRICTED: 2,
  ETH_TO_ERC721_PARTIAL_RESTRICTED: 3,
  ETH_TO_ERC1155_FULL_OPEN: 4,
  ETH_TO_ERC1155_PARTIAL_OPEN: 5,
  ETH_TO_ERC1155_FULL_RESTRICTED: 6,
  ETH_TO_ERC1155_PARTIAL_RESTRICTED: 7,
  ERC20_TO_ERC721_FULL_OPEN: 8,
  ERC20_TO_ERC721_PARTIAL_OPEN: 9,
  ERC20_TO_ERC721_FULL_RESTRICTED: 10,
  ERC20_TO_ERC721_PARTIAL_RESTRICTED: 11,
  ERC20_TO_ERC1155_FULL_OPEN: 12,
  ERC20_TO_ERC1155_PARTIAL_OPEN: 13,
  ERC20_TO_ERC1155_FULL_RESTRICTED: 14,
  ERC20_TO_ERC1155_PARTIAL_RESTRICTED: 15,
  ERC721_TO_ERC20_FULL_OPEN: 16,
  ERC721_TO_ERC20_PARTIAL_OPEN: 17,
  ERC721_TO_ERC20_FULL_RESTRICTED: 18,
  ERC721_TO_ERC20_PARTIAL_RESTRICTED: 19,
  ERC1155_TO_ERC20_FULL_OPEN: 20,
  ERC1155_TO_ERC20_PARTIAL_OPEN: 21,
  ERC1155_TO_ERC20_FULL_RESTRICTED: 22,
  ERC1155_TO_ERC20_PARTIAL_RESTRICTED: 23
};

const changeNetwork = async ({ networkName }) => {
  try {
    if (!window.ethereum) {
      throw new Error("Please install MetaMask to use this dApp");
    }
    
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const targetChainId = networks[networkName].chainId;
    
    if (chainId === targetChainId) {
      return { success: true, message: "Already on correct network" };
    }
    
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetChainId }],
      });
      return { success: true, message: `Switched to ${networks[networkName].chainName}` };
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{ ...networks[networkName] }],
          });
          return { success: true, message: `Added and switched to ${networks[networkName].chainName}` };
        } catch (addError) {
          throw new Error(`Please add ${networks[networkName].chainName} network manually in MetaMask`);
        }
      } else if (switchError.code === 4001) {
        throw new Error("Network switch was rejected. Please switch manually.");
      } else {
        throw new Error(`Failed to switch network: ${switchError.message}`);
      }
    }
  } catch (err) {
    throw err;
  }
};

export const handleNetworkSwitch = async () => {
  try {
    // Force Base Sepolia regardless of environment variable
    const networkName = "base_sepolia";
    await changeNetwork({ networkName });
  } catch (error) {
    console.error("Network switch error:", error);
    throw error;
  }
};