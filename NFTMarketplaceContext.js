import React, { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import axios from "axios";
import { supabaseClient } from "../lib/supabaseClient.js";

// INTERNAL IMPORT
import {
  AntevortaGoldAddress,
  AntevortaGoldABI,
  SeaportAddress,
  SeaportABI,
  handleNetworkSwitch,
  ItemType,
  OrderType,
  BasicOrderType
} from "./constants";

// Network configurations for public RPC access - BASE SEPOLIA ONLY
const networks = {
  base_sepolia: {
    rpcUrls: ["https://sepolia.base.org", "https://base-sepolia.public.blastapi.io"],
  },
  localhost: {
    rpcUrls: ["http://127.0.0.1:8545/"],
  },
};

// Pinata configuration
const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
const PINATA_POST_URL = process.env.NEXT_PUBLIC_PINATA_POST_URL;
const PINATA_HASH_URL = process.env.NEXT_PUBLIC_PINATA_HASH_URL;
const PINATA_POST_JSON_URL = process.env.NEXT_PUBLIC_PINATA_POST_JSON_URL;

// Fetch AntevortaGold contract
const fetchGoldContract = (signerOrProvider) => {
  return new ethers.Contract(
    AntevortaGoldAddress,
    AntevortaGoldABI,
    signerOrProvider
  );
};

// Fetch Seaport contract
const fetchSeaportContract = (signerOrProvider) => {
  if (!SeaportAddress) {
    throw new Error("SeaportAddress is undefined. Check network configuration.");
  }
  
  return new ethers.Contract(
    SeaportAddress,
    SeaportABI,
    signerOrProvider
  );
};

// Connect with AntevortaGold contract
const connectingWithGoldContract = async () => {
  try {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = fetchGoldContract(signer);
    return contract;
  } catch (error) {
    console.error("Error connecting with gold contract:", error);
    throw error;
  }
};

// Connect with Seaport contract
const connectingWithSeaport = async () => {
  try {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = fetchSeaportContract(signer);
    return { contract, signer, provider };
  } catch (error) {
    console.error("Error connecting with Seaport:", error);
    throw error;
  }
};

// Get public provider for read-only operations - FORCE BASE SEPOLIA
const getPublicProvider = async () => {
  try {
    // Force Base Sepolia regardless of environment variable
    const networkName = "base_sepolia";
    const networkConfig = networks[networkName];
    
    if (!networkConfig || !networkConfig.rpcUrls.length) {
      throw new Error("Base Sepolia network not configured");
    }

    for (const rpcUrl of networkConfig.rpcUrls) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        
        // Verify we're on Base Sepolia
        if (network.chainId !== 84532) {
          console.warn("⚠️ Connected to wrong network! Expected Base Sepolia (84532), got:", network.chainId);
        }
        
        return provider;
      } catch (error) {
        continue;
      }
    }
    
    throw new Error("All Base Sepolia RPC endpoints failed");
  } catch (error) {
    console.error("Error creating public provider:", error);
    return new ethers.providers.JsonRpcProvider("https://sepolia.base.org");
  }
};

// Context creation
export const NFTMarketplaceContext = React.createContext();

export const NFTMarketplaceProvider = ({ children }) => {
  const titleData = "Own Physical Gold Through Blockchain Technology";

  // State management
  const [error, setError] = useState("");
  const [openError, setOpenError] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [accountBalance, setAccountBalance] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMinter, setIsMinter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]);
  const router = useRouter();

  // Check if wallet is connected
  const checkIfWalletConnected = async () => {
    try {
      if (!window.ethereum) {
        setError("Please install MetaMask to connect your wallet");
        setOpenError(true);
        return;
      }
      
      const network = await handleNetworkSwitch();
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const getBalance = await provider.getBalance(accounts[0]);
        const bal = ethers.utils.formatEther(getBalance);
        setAccountBalance(bal);
        
        await checkRoles(accounts[0]);
        return accounts[0];
      } else {
        console.log("No account found");
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
      return null;
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError("Please install MetaMask to use this marketplace");
        setOpenError(true);
        return;
      }

      // Force network switch to Base Sepolia
      try {
        const networkResult = await handleNetworkSwitch();
        
        // Verify we're on the correct network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId !== "0x14a34") {
          setError("Please switch to Base Sepolia network in MetaMask");
          setOpenError(true);
          return;
        }
      } catch (networkError) {
        let networkMessage = "Network connection issue";
        
        if (networkError.message.includes("rejected")) {
          networkMessage = "Please switch to Base Sepolia network to continue";
        } else if (networkError.message.includes("add it manually")) {
          networkMessage = "Please add Base Sepolia network to MetaMask manually";
        }
        
        setError(networkMessage);
        setOpenError(true);
        return;
      }

      let accounts;
      try {
        accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
      } catch (connectionError) {
        let connectionMessage = "Connection failed";
        
        if (connectionError.code === 4001) {
          connectionMessage = "Connection was rejected. Please try again.";
        } else if (connectionError.code === -32002) {
          connectionMessage = "Please check MetaMask - connection request is pending";
        }
        
        setError(connectionMessage);
        setOpenError(true);
        return;
      }

      if (!accounts || accounts.length === 0) {
        setError("Please connect your wallet to continue");
        setOpenError(true);
        return;
      }

      setCurrentAccount(accounts[0]);
      await checkRoles(accounts[0]);

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const getBalance = await provider.getBalance(accounts[0]);
        const bal = ethers.utils.formatEther(getBalance);
        setAccountBalance(bal);
      } catch (balanceError) {
        console.error("Error getting balance:", balanceError);
      }
    } catch (error) {
      console.error("Unexpected error in connectWallet:", error);
      setError("An unexpected error occurred. Please try again.");
      setOpenError(true);
    }
  };

  // Check user roles for AntevortaGold contract
  const checkRoles = async (address) => {
    try {
      if (!address) {
        setIsAdmin(false);
        setIsMinter(false);
        return;
      }
      
      if (!AntevortaGoldAddress) {
        console.error("AntevortaGold contract address not defined in environment variables");
        setIsAdmin(false);
        setIsMinter(false);
        return;
      }
      
      const provider = await getPublicProvider();
      const contract = fetchGoldContract(provider);
      
      try {
        const contractName = await contract.name();
      } catch (err) {
        console.error("Cannot access contract - contract may not be deployed at this address on this network:", err);
        setIsAdmin(false);
        setIsMinter(false);
        return;
      }
      
      const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;
      const GOLD_MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("GOLD_MINTER_ROLE"));
      
      const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, address);
      const hasMinterRole = await contract.hasRole(GOLD_MINTER_ROLE, address);
      
      setIsAdmin(hasAdminRole);
      setIsMinter(hasMinterRole);
    } catch (err) {
      console.error("Role check failed:", err);
      setIsAdmin(false);
      setIsMinter(false);
    }
  };

  // Check if contract is paused
  const checkIfPaused = async () => {
    try {
      const provider = await getPublicProvider();
      const contract = fetchGoldContract(provider);
      const paused = await contract.paused();
      setIsPaused(paused);
      return paused;
    } catch (error) {
      console.error("Error checking pause status:", error);
      return false;
    }
  };

  // Toggle pause state
  const togglePause = async () => {
    try {
      setLoading(true);
      
      const contract = await connectingWithGoldContract();
      const currentPaused = await contract.paused();
      
      const transaction = currentPaused
        ? await contract.unpauseGoldTransfers()
        : await contract.pauseGoldTransfers();
      
      await transaction.wait();
      await checkIfPaused();
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error("Error toggling pause:", error);
      setError("Unable to update contract status. Please try again.");
      setOpenError(true);
      return { success: false };
    }
  };

  // Upload to IPFS/Pinata
  const uploadToPinata = async (file) => {
    if (file) {
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios({
          method: "post",
          url: `${PINATA_POST_URL}`,
          data: formData,
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY,
            "Content-Type": "multipart/form-data",
          },
        });
        
        const ImgHash = `${PINATA_HASH_URL}${response.data.IpfsHash}`;
        setLoading(false);
        return ImgHash;
      } catch (error) {
        setLoading(false);
        setError("Unable to upload image. Please try again.");
        console.log(error);
      }
    }
    setError("Please select an image file to upload");
  };

  // Mint new Gold NFT (admin only)
  const mintGoldNFT = async (to, name, description, image) => {
    if (!name || !description || !image) {
      setError("Please fill in all required fields");
      setOpenError(true);
      return;
    }

    const data = JSON.stringify({ 
      name, 
      description, 
      image,
      attributes: [
        { trait_type: "Material", value: "Gold" },
        { trait_type: "Purity", value: "99.99%" },
        { trait_type: "Type", value: "Physical Gold Coin" }
      ]
    });

    try {
      setLoading(true);
      
      // Upload metadata to IPFS
      const response = await axios({
        method: "POST",
        url: `${PINATA_POST_JSON_URL}`,
        data: data,
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
          "Content-Type": "application/json",
        },
      });

      const url = `${PINATA_HASH_URL}${response.data.IpfsHash}`;
      
      // Call gold contract mintGoldToken function
      const contract = await connectingWithGoldContract();
      const transaction = await contract.mintGoldToken(to || currentAccount, url);
      await transaction.wait();
      
      setLoading(false);
      return { success: true, tokenId: transaction.value };
    } catch (error) {
      setLoading(false);
      setError("Unable to mint Gold NFT. Please check your permissions.");
      setOpenError(true);
      return { success: false };
    }
  };

  // Create Seaport listing order
  const createSeaportListing = async (tokenId, priceEth) => {
    try {
      setLoading(true);
      
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const seller = await signer.getAddress();

      const seaport = new ethers.Contract(SeaportAddress, SeaportABI, signer);
      const gold = new ethers.Contract(AntevortaGoldAddress, AntevortaGoldABI, signer);

      // 1) approve Seaport once
      if (!(await gold.isApprovedForAll(seller, SeaportAddress))) {
        await (await gold.setApprovalForAll(SeaportAddress, true)).wait();
      }

      // 2) order components
      const counter = await seaport.getCounter(seller);
      const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32));
      
      // Use chain time to avoid InvalidTime errors
      const latestBlock = await provider.getBlock("latest");
      const chainNow = latestBlock.timestamp;
      const startTime = 0;                               // actif immédiatement
      const endTime = ethers.constants.MaxUint256;     // n'expire jamais
      
      const priceWei = ethers.utils.parseEther(priceEth.toString());

      const params = {
        offerer: seller,
        zone: ethers.constants.AddressZero,
        offer: [{
          itemType: 2, // ERC721
          token: AntevortaGoldAddress,
          identifierOrCriteria: ethers.BigNumber.from(tokenId),
          startAmount: ethers.BigNumber.from(1),
          endAmount: ethers.BigNumber.from(1),
        }],
        consideration: [{
          itemType: 0, // NATIVE/ETH
          token: ethers.constants.AddressZero,
          identifierOrCriteria: ethers.BigNumber.from(0),
          startAmount: priceWei,
          endAmount: priceWei,
          recipient: seller,
        }],
        orderType: 0, // FULL_OPEN
        startTime: ethers.BigNumber.from(startTime),
        endTime: ethers.BigNumber.from(endTime),
        zoneHash: ethers.constants.HashZero,
        salt,
        conduitKey: ethers.constants.HashZero,
        counter,
      };

      // 3) sign OrderComponents (EIP-712)
      const [version] = await seaport.information(); // returns (string version, bytes32 domainSeparator, address conduitController)
      const domain = { 
        name: "Seaport", 
        version, 
        chainId: await signer.getChainId(), 
        verifyingContract: SeaportAddress 
      };
      
      const types = {
        OrderComponents: [
          { name: "offerer", type: "address" },
          { name: "zone", type: "address" },
          { name: "offer", type: "OfferItem[]" },
          { name: "consideration", type: "ConsiderationItem[]" },
          { name: "orderType", type: "uint8" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "zoneHash", type: "bytes32" },
          { name: "salt", type: "uint256" },
          { name: "conduitKey", type: "bytes32" },
          { name: "counter", type: "uint256" }
        ],
        OfferItem: [
          { name: "itemType", type: "uint8" },
          { name: "token", type: "address" },
          { name: "identifierOrCriteria", type: "uint256" },
          { name: "startAmount", type: "uint256" },
          { name: "endAmount", type: "uint256" }
        ],
        ConsiderationItem: [
          { name: "itemType", type: "uint8" },
          { name: "token", type: "address" },
          { name: "identifierOrCriteria", type: "uint256" },
          { name: "startAmount", type: "uint256" },
          { name: "endAmount", type: "uint256" },
          { name: "recipient", type: "address" }
        ]
      };
      
      const signature = await signer._signTypedData(domain, types, params);

      // 4) persist (store helpful denorm fields too)
      await axios.post("/api/orders", {
        parameters: {
          ...params,
          // ensure BigNumbers are strings:
          offer: params.offer.map(o => ({
            ...o, 
            identifierOrCriteria: o.identifierOrCriteria.toString(), 
            startAmount: o.startAmount.toString(), 
            endAmount: o.endAmount.toString()
          })),
          consideration: params.consideration.map(c => ({
            ...c, 
            identifierOrCriteria: c.identifierOrCriteria.toString(), 
            startAmount: c.startAmount.toString(), 
            endAmount: c.endAmount.toString()
          })),
          startTime: params.startTime.toString(), 
          endTime: params.endTime.toString(), 
          counter: params.counter.toString(),
          totalOriginalConsiderationItems: params.consideration.length
        },
        signature,
        status: "active",
        token_id: tokenId,
        maker: seller,
        price_wei: priceWei.toString()
      });

      setLoading(false);
      return { success: true };
      
    } catch (error) {
      setLoading(false);
      console.error("Failed to create listing:", error);
      setError("Failed to create listing. Please try again.");
      setOpenError(true);
      return { success: false };
    }
  };

  // CORRECTED buyNFTSeaport function using fulfillOrder
  const buyNFTSeaport = async (order) => {
    try {
      setLoading(true);
      
      // Connect to Seaport
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const buyerAddress = await signer.getAddress();
      
      const seaportContract = new ethers.Contract(
        SeaportAddress,
        SeaportABI,
        signer
      );
      
      // Guard against missing order data
      if (!order || !order.parameters) {
        throw new Error("Listing not found or already filled/cancelled.");
      }

      // Rebuild OrderParameters explicitly & safely
      const p = order.parameters || {};
      const toBN = (v) => ethers.BigNumber.from(
        typeof v === "string" ? v :
        typeof v === "number" ? v :
        v && v._hex ? v._hex :
        v && v.hex ? v.hex : v ?? 0
      );

      const rebuiltParams = {
        offerer: p.offerer,
        zone: p.zone || ethers.constants.AddressZero,
        offer: (p.offer || []).map(o => ({
          itemType: Number(o.itemType), // <- important
          token: o.token,
          identifierOrCriteria: toBN(o.identifierOrCriteria),
          startAmount: toBN(o.startAmount),
          endAmount: toBN(o.endAmount),
        })),
        consideration: (p.consideration || []).map(c => ({
          itemType: Number(c.itemType), // <- important
          token: c.token || ethers.constants.AddressZero,
          identifierOrCriteria: toBN(c.identifierOrCriteria ?? 0),
          startAmount: toBN(c.startAmount),
          endAmount: toBN(c.endAmount),
          recipient: c.recipient,
        })),
        orderType: Number(p.orderType), // <- important
        startTime: toBN(p.startTime),
        endTime: toBN(p.endTime),
        zoneHash: p.zoneHash || ethers.constants.HashZero,
        salt: toBN(p.salt),
        conduitKey: p.conduitKey || ethers.constants.HashZero,
        totalOriginalConsiderationItems:
          Number(p.totalOriginalConsiderationItems ?? (p.consideration?.length || 0)),
      };

      const orderForFulfillment = {
        parameters: rebuiltParams,
        signature: order.signature
      };

      // Debug logs for validation
      console.log("orderType", rebuiltParams.orderType,
                  "offer.itemType", rebuiltParams.offer[0]?.itemType,
                  "consideration.itemType", rebuiltParams.consideration[0]?.itemType);

      if ([rebuiltParams.orderType,
           rebuiltParams.offer[0]?.itemType,
           rebuiltParams.consideration[0]?.itemType].some(v => Number.isNaN(v))) {
        throw new Error("Order has undefined/NaN uint8 fields (orderType/itemType).");
      }

      // Micro-diagnostic côté acheteur (utile pour vérifier)
      const blockTs = (await provider.getBlock("latest")).timestamp;
      console.log("now", blockTs,
        "start", rebuiltParams.startTime.toString(),
        "end", rebuiltParams.endTime.toString());
      
      // Calculate total ETH value to send (sum all native ETH consideration amounts)
      const value = orderForFulfillment.parameters.consideration
        .filter(c => c.itemType === 0 && c.token === ethers.constants.AddressZero)
        .reduce((acc, c) => acc.add(c.startAmount), ethers.BigNumber.from(0));
      
      // Verify buyer has enough ETH
      const buyerBalance = await provider.getBalance(buyerAddress);
      if (buyerBalance.lt(value)) {
        throw new Error(
          `Insufficient ETH. Need ${ethers.utils.formatEther(value)} ETH`
        );
      }
      
      // Simulate the transaction first to catch errors early
      try {
        await seaportContract.callStatic.fulfillOrder(
          orderForFulfillment,
          ethers.constants.HashZero,
          { value }
        );
      } catch (simulationError) {
        console.error("Transaction simulation failed:", simulationError);
        console.error("Full error details:", {
          message: simulationError.message,
          code: simulationError.code,
          data: simulationError.data
        });
        throw new Error("Order validation failed. The listing may be invalid or already sold.");
      }
      
      // Execute the purchase using fulfillOrder (simpler and more robust)
      const tx = await seaportContract.fulfillOrder(
        orderForFulfillment,
        ethers.constants.HashZero, // conduitKey
        {
          value: value, // Send ETH with the transaction
          gasLimit: 500000 // Sufficient gas
        }
      );
      
      const receipt = await tx.wait();
      
      // Update order status in database
      try {
        await axios.post("/api/orders/mark-fulfilled", {
          orderHash: order.order_hash || tx.hash
        });
      } catch (err) {
        console.warn("Could not update order status:", err);
      }
      
      setLoading(false);
      router.push("/author");
      return { success: true, receipt };
      
    } catch (error) {
      setLoading(false);
      console.error("Purchase failed:", error);
      
      // User-friendly error messages
      let errorMessage = "Purchase failed. ";
      
      if (error.message?.includes("Insufficient ETH")) {
        errorMessage = error.message;
      } else if (error.code === 4001) {
        errorMessage = "Transaction was cancelled.";
      } else if (error.code === "CALL_EXCEPTION") {
        errorMessage = "Order execution failed. The listing may be invalid or already sold.";
      } else {
        errorMessage += "Please verify the listing is still active and try again.";
      }
      
      setError(errorMessage);
      setOpenError(true);
      return { success: false };
    }
  };

  // Cancel Seaport order
  const cancelSeaportOrder = async (order) => {
    try {
      setLoading(true);
      
      const { contract } = await connectingWithSeaport();
      
      // Cancel the order on-chain
      const transaction = await contract.cancel([order.parameters]);
      await transaction.wait();
      
      // Mark order as cancelled in database
      try {
        const orderHash = order.order_hash || order.parameters.orderHash;
        if (orderHash) {
          await axios.get(`/api/orders/mark-cancelled?hash=${orderHash}`);
        }
      } catch (error) {
        console.error("Error marking order as cancelled:", error);
        // Continue anyway as the transaction was successful
      }
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error("Error canceling order:", error);
      setError("Unable to cancel order. Please try again.");
      setOpenError(true);
      return { success: false };
    }
  };

  // Fetch all Gold NFTs
  const fetchGoldNFTs = async () => {
    try {
      const provider = await getPublicProvider();
      const contract = fetchGoldContract(provider);
      
      const totalSupply = await contract.totalGoldSupply();
      const nfts = [];
      
      for (let i = 0; i < totalSupply; i++) {
        try {
          const tokenURI = await contract.tokenURI(i);
          const owner = await contract.ownerOf(i);
          
          const { data } = await axios.get(tokenURI);
          
          nfts.push({
            tokenId: i,
            owner,
            tokenURI,
            ...data
          });
        } catch (error) {
          console.error(`Error fetching NFT ${i}:`, error);
        }
      }
      
      return nfts;
    } catch (error) {
      console.error("Error fetching Gold NFTs:", error);
      setError("Unable to load NFTs. Please refresh the page.");
      setOpenError(true);
      return [];
    }
  };

  // Fetch active Seaport orders
  const fetchActiveOrders = async () => {
    try {
      // Fetch active orders from database (no revalidation needed)
      const { data } = await axios.get("/api/orders", { params: { status: "active" } });
      
      setActiveOrders(data);
      return data;
    } catch (error) {
      console.error("Error fetching active orders:", error);
      return [];
    }
  };

  // Fetch my Gold NFTs
  const fetchMyGoldNFTs = async () => {
    try {
      if (!currentAccount) return [];
      
      const provider = await getPublicProvider();
      const contract = fetchGoldContract(provider);
      
      const totalSupply = await contract.totalGoldSupply();
      const myNFTs = [];
      
      for (let i = 0; i < totalSupply; i++) {
        try {
          const owner = await contract.ownerOf(i);
          if (owner.toLowerCase() === currentAccount.toLowerCase()) {
            const tokenURI = await contract.tokenURI(i);
            const { data } = await axios.get(tokenURI);
            
            myNFTs.push({
              tokenId: i,
              owner,
              tokenURI,
              ...data
            });
          }
        } catch (error) {
          console.error(`Error fetching NFT ${i}:`, error);
        }
      }
      
      return myNFTs;
    } catch (error) {
      console.error("Error fetching my Gold NFTs:", error);
      setError("Unable to load your NFTs. Please try again.");
      setOpenError(true);
      return [];
    }
  };

  // Get royalty info
  const getRoyaltyInfo = async (tokenId = 1) => {
    try {
      const provider = await getPublicProvider();
      const contract = fetchGoldContract(provider);
      
      const salePrice = ethers.utils.parseEther("1");
      const [receiver, royaltyAmount] = await contract.royaltyInfo(tokenId, salePrice);
      
      const bps = royaltyAmount.mul(10000).div(salePrice);
      
      return { 
        fee: bps.toNumber(), 
        receiver,
        feePercentage: (bps.toNumber() / 100).toFixed(2)
      };
    } catch (err) {
      console.error("Error getting royalty info:", err);
      return { fee: 0, receiver: ethers.constants.AddressZero, feePercentage: "0.00" };
    }
  };

  // Update royalty info (admin only)
  const updateRoyaltyInfo = async (recipient, feeBps) => {
    try {
      setLoading(true);
      const contract = await connectingWithGoldContract();
      
      const tx = await contract.setGoldRoyaltyInfo(recipient, feeBps);
      await tx.wait();
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error("Failed to update royalty info:", error);
      setError("Unable to update royalty settings. Please try again.");
      setOpenError(true);
      return { success: false };
    }
  };

  // Admin mint NFT (alias for mintGoldNFT)
  const adminMintNFT = async (name, description, image) => {
    return await mintGoldNFT(null, name, description, image);
  };

  // Update royalty fee (admin only)
  const updateRoyaltyFeeBps = async (feeBps) => {
    try {
      setLoading(true);
      const contract = await connectingWithGoldContract();
      
      // Get current royalty info first
      const currentInfo = await getRoyaltyInfo();
      const tx = await contract.setGoldRoyaltyInfo(currentInfo.receiver, feeBps);
      await tx.wait();
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error("Failed to update royalty fee:", error);
      setError("Unable to update royalty fee. Please try again.");
      setOpenError(true);
      return { success: false };
    }
  };

  // Update royalty receiver (admin only)
  const updateRoyaltyReceiver = async (recipient) => {
    try {
      setLoading(true);
      const contract = await connectingWithGoldContract();
      
      // Get current royalty info first
      const currentInfo = await getRoyaltyInfo();
      const tx = await contract.setGoldRoyaltyInfo(recipient, currentInfo.fee);
      await tx.wait();
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error("Failed to update royalty receiver:", error);
      setError("Unable to update royalty receiver. Please try again.");
      setOpenError(true);
      return { success: false };
    }
  };

  // Set burn address (admin only)
  const setBurnAddress = async (burnAddress) => {
    try {
      setLoading(true);
      const contract = await connectingWithGoldContract();
      
      const tx = await contract.setGoldBurnAddress(burnAddress);
      await tx.wait();
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error("Failed to set burn address:", error);
      setError("Unable to set burn address. Please try again.");
      setOpenError(true);
      return { success: false };
    }
  };

  // Set vault recovery address (admin only)
  const setVaultRecoveryAddress = async (recoveryAddress) => {
    try {
      setLoading(true);
      const contract = await connectingWithGoldContract();
      
      const tx = await contract.setVaultRecoveryAddress(recoveryAddress);
      await tx.wait();
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error("Failed to set vault recovery address:", error);
      setError("Unable to set vault recovery address. Please try again.");
      setOpenError(true);
      return { success: false };
    }
  };

  // Recover gold token (admin only)
  const recoverGoldToken = async (from, tokenId) => {
    try {
      setLoading(true);
      const contract = await connectingWithGoldContract();
      
      const tx = await contract.recoverGoldToken(from, tokenId);
      await tx.wait();
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error("Failed to recover gold token:", error);
      setError("Unable to recover gold token. Please try again.");
      setOpenError(true);
      return { success: false };
    }
  };

  // Update gold metadata (admin only)
  const updateGoldMetadata = async (tokenId, name, description, image) => {
    if (!name || !description || !image) {
      setError("Please fill in all required fields");
      setOpenError(true);
      return { success: false };
    }

    const data = JSON.stringify({ 
      name, 
      description, 
      image,
      attributes: [
        { trait_type: "Material", value: "Gold" },
        { trait_type: "Purity", value: "99.99%" },
        { trait_type: "Type", value: "Physical Gold Coin" }
      ]
    });

    try {
      setLoading(true);
      
      // Upload metadata to IPFS
      const response = await axios({
        method: "POST",
        url: `${PINATA_POST_JSON_URL}`,
        data: data,
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
          "Content-Type": "application/json",
        },
      });

      const url = `${PINATA_HASH_URL}${response.data.IpfsHash}`;
      
      // Update token URI
      const contract = await connectingWithGoldContract();
      const transaction = await contract.updateGoldMetadata(tokenId, url);
      await transaction.wait();
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      setError("Unable to update Gold NFT metadata. Please check your permissions.");
      setOpenError(true);
      return { success: false };
    }
  };

  // Get contract stats
  const getContractStats = async () => {
    try {
      const provider = await getPublicProvider();
      const contract = fetchGoldContract(provider);
      
      const totalSupply = await contract.totalGoldSupply();
      const activeOrders = await fetchActiveOrders();
      
      return {
        totalMinted: totalSupply.toNumber(),
        totalListed: activeOrders.length,
        available: activeOrders.length
      };
    } catch (err) {
      console.error("Error getting contract stats:", err);
      return { totalMinted: 0, totalListed: 0, available: 0 };
    }
  };

  // Get user's NFTs for listing
  const getUserNFTs = async () => {
    try {
      if (!currentAccount) {
        return [];
      }
      
      const provider = await getPublicProvider();
      const contract = fetchGoldContract(provider);
      
      // Get total supply to know how many tokens exist
      const totalSupply = await contract.totalGoldSupply();
      
      // Get user's balance
      const userBalance = await contract.balanceOf(currentAccount);
      
      const userNFTs = [];
      
      // If user has no tokens, return empty array
      if (userBalance.toNumber() === 0) {
        return [];
      }
      
      // Check each token to see if it belongs to the current user
      for (let i = 0; i < totalSupply.toNumber(); i++) {
        try {
          const tokenId = i;
          
          const owner = await contract.ownerOf(tokenId);
          
          if (owner.toLowerCase() === currentAccount.toLowerCase()) {
            // Get token URI
            const tokenURI = await contract.tokenURI(tokenId);
            
            // Fetch metadata from IPFS
            let metadata = null;
            try {
              const response = await axios.get(tokenURI);
              metadata = response.data;
            } catch (error) {
              metadata = {
                name: `Gold NFT #${tokenId}`,
                description: "Gold NFT metadata not available",
                image: null
              };
            }
            
            userNFTs.push({
              tokenId: tokenId,
              owner: owner,
              name: metadata?.name || `Gold NFT #${tokenId}`,
              description: metadata?.description || "No description available",
              image: metadata?.image || null,
              tokenURI: tokenURI
            });
          }
        } catch (error) {
          continue;
        }
      }
      
      return userNFTs;
    } catch (error) {
      console.error("Error fetching user NFTs:", error);
      return [];
    }
  };

  // UseEffect for initialization
  useEffect(() => {
    checkIfWalletConnected();
    checkIfPaused();
    fetchActiveOrders();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
          checkRoles(accounts[0]);
        } else {
          setCurrentAccount(null);
          setIsAdmin(false);
          setIsMinter(false);
        }
      });
    }
  }, []);

  return (
    <NFTMarketplaceContext.Provider
      value={{
        // Wallet functions
        checkIfWalletConnected,
        connectWallet,
        currentAccount,
        accountBalance,
        
        // NFT functions
        uploadToPinata,
        mintGoldNFT,
        fetchGoldNFTs,
        fetchMyGoldNFTs,
        getUserNFTs,
        
        // Seaport functions
        createSeaportListing,
        buyNFTSeaport,
        cancelSeaportOrder,
        fetchActiveOrders,
        activeOrders,
        
        // Admin functions
        isAdmin,
        isMinter,
        isPaused,
        togglePause,
        getRoyaltyInfo,
        updateRoyaltyInfo,
        getContractStats,
        adminMintNFT,
        updateRoyaltyFeeBps,
        updateRoyaltyReceiver,
        setBurnAddress,
        setVaultRecoveryAddress,
        recoverGoldToken,
        updateGoldMetadata,
        
        // Legacy compatibility
        isOwner: isAdmin,
        
        // UI state
        titleData,
        setOpenError,
        openError,
        error,
        loading,
      }}
    >
      {children}
    </NFTMarketplaceContext.Provider>
  );
};