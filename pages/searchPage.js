import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import { FaSearch, FaFilter, FaSort, FaCoins, FaShieldAlt, FaChartLine, FaTimes } from "react-icons/fa";
import { GiGoldBar } from "react-icons/gi";
import { MdVerified } from "react-icons/md";

//INTERNAL IMPORT
import Style from "../styles/searchPage.module.css";
import { NFTCard, Button, Loader } from "../components/componentsindex";
import SellNFTModal from "../components/SellNFTModal/SellNFTModal";
import { NFTMarketplaceContext } from "../Context/NFTMarketplaceContext";

const SearchPage = () => {
  const router = useRouter();
  const { 
    fetchGoldNFTs, 
    fetchActiveOrders, 
    buyNFTSeaport, 
    cancelSeaportOrder,
    createSeaportListing,
    currentAccount, 
    fetchMyGoldNFTs, 
    getRoyaltyInfo, 
    activeOrders,
    loading 
  } = useContext(NFTMarketplaceContext);
  
  const [nfts, setNfts] = useState([]);
  const [filteredNFTs, setFilteredNFTs] = useState([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(true);
  const [stats, setStats] = useState({
    totalValue: "0",
    avgPrice: "0",
    totalNFTs: "0",
    marketVolume: "0"
  });

  // Sell modal states
  const [showSellModal, setShowSellModal] = useState(false);
  const [myNFTs, setMyNFTs] = useState([]);
  const [royaltyInfo, setRoyaltyInfo] = useState(null);
  
  // Filters
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [marketType, setMarketType] = useState("all");

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    try {
      setMarketplaceLoading(true);
      
      // Fetch all Gold NFTs and active Seaport orders
      const [allNFTs, orders] = await Promise.all([
        fetchGoldNFTs(),
        fetchActiveOrders()
      ]);
      
      console.log("=== LOAD NFTS DEBUG ===");
      console.log("All NFTs fetched:", allNFTs);
      console.log("Active orders fetched:", orders);
      
      // Combine NFT data with order information
      const nftsWithOrders = allNFTs.map(nft => {
        console.log(`Processing NFT ${nft.tokenId} (type: ${typeof nft.tokenId})`);
        const order = orders.find(o => {
          console.log(`Comparing with order token_id: ${o.token_id} (type: ${typeof o.token_id})`);
          const match = Number(o.token_id) === nft.tokenId;
          console.log(`Match: ${match}`);
          return match;
        });
        
        console.log(`NFT ${nft.tokenId} - Order found:`, order);
        
        return {
          ...nft,
          price: order ? ethers.utils.formatEther(order.price_wei.toString()) : "0",
          seller: order ? order.maker : nft.owner,
          sold: !order,
          order: order
        };
      });
      
      // Filter to show only NFTs that are listed for sale
      const listedNFTs = nftsWithOrders.filter(nft => nft.order);
      
      setNfts(listedNFTs);
      setFilteredNFTs(listedNFTs);
      
      // Calculate stats
      const totalNFTs = listedNFTs.length;
      const totalValue = listedNFTs.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
      const avgPrice = totalNFTs > 0 ? (totalValue / totalNFTs).toFixed(3) : "0";
      setStats({
        totalValue: totalValue.toFixed(2),
        avgPrice: avgPrice,
        totalNFTs: totalNFTs.toString(),
        marketVolume: (totalValue * 0.025).toFixed(2)
      });
      
      setMarketplaceLoading(false);
    } catch (error) {
      console.error("Error loading NFTs:", error);
      setMarketplaceLoading(false);
    }
  };

  const openSellModal = async () => {
    if (!currentAccount) {
      alert("Please connect your wallet");
      return;
    }
    try {
      const owned = await fetchMyGoldNFTs();
      if (!owned || owned.length === 0) {
        alert("You don't own any gold NFTs to sell.");
        return;
      }
      const info = await getRoyaltyInfo();
      setMyNFTs(owned);
      setRoyaltyInfo(info);
      setShowSellModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSellNFT = async (nft, price) => {
    try {
      const result = await createSeaportListing(nft.tokenId, price);
      if (result.success) {
        alert("NFT listed successfully on Seaport");
        setShowSellModal(false);
        await loadNFTs();
      } else {
        alert("Failed to list NFT");
      }
    } catch (err) {
      console.error("Sell error", err);
      alert("Failed to list NFT");
    }
  };

  // Cancel Seaport listing
  const handleCancelListing = async (nft) => {
    if (!currentAccount) {
      alert("Please connect your wallet");
      return;
    }

    if (!confirm("Are you sure you want to cancel this listing? The NFT will be returned to your collection.")) {
      return;
    }

    try {
      // Create order object with the expected structure for cancelSeaportOrder
      const orderForSeaport = {
        parameters: nft.order.parameters,
        signature: nft.order.signature,
        order_hash: nft.order.order_hash
      };
      
      const result = await cancelSeaportOrder(orderForSeaport);
      if (result.success) {
        alert("Listing cancelled successfully!");
        await loadNFTs();
      } else {
        alert("Failed to cancel listing");
      }
    } catch (error) {
      console.error("Error cancelling listing:", error);
      alert("Failed to cancel listing");
    }
  };

  // Check if user is the seller
  const isUserSeller = (nft) => {
    return currentAccount && nft.seller.toLowerCase() === currentAccount.toLowerCase();
  };

  useEffect(() => {
    applyFilters();
  }, [minPrice, maxPrice, sortBy, marketType, nfts]);

  const applyFilters = () => {
    let filtered = [...nfts];

    // Price filter
    if (minPrice) {
      filtered = filtered.filter(nft => parseFloat(nft.price) >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter(nft => parseFloat(nft.price) <= parseFloat(maxPrice));
    }

    // Market type filter
    if (marketType === "primary") {
      filtered = filtered.filter(nft => nft.seller.toLowerCase() === nft.owner.toLowerCase());
    } else if (marketType === "secondary") {
      filtered = filtered.filter(nft => nft.seller.toLowerCase() !== nft.owner.toLowerCase());
    }

    // Sort
    if (sortBy === "recent") {
      filtered.sort((a, b) => b.tokenId - a.tokenId);
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => a.tokenId - b.tokenId);
    }

    setFilteredNFTs(filtered);
  };

  const handleBuyNFT = async (nft) => {
    if (!currentAccount) {
      alert("Please connect your wallet");
      return;
    }
    try {
      // Create order object with the expected structure for buyNFTSeaport
      const orderForSeaport = {
        parameters: nft.order.parameters,
        signature: nft.order.signature,
        order_hash: nft.order.order_hash
      };
      
      const result = await buyNFTSeaport(orderForSeaport);
      if (result.success) {
        alert("NFT purchased successfully!");
        await loadNFTs();
      } else {
        alert("Failed to purchase NFT");
      }
    } catch (error) {
      console.error("Error buying NFT:", error);
      alert("Failed to purchase NFT");
    }
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSortBy("recent");
    setMarketType("all");
  };

  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 15 + Math.random() * 20
  }));

  return (
    <div className={Style.searchPage}>
      {/* Animated Gold Particles */}
      <div className={Style.particlesContainer}>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className={Style.goldParticle}
            initial={{ x: `${particle.x}%`, y: `${particle.y}%` }}
            animate={{
              x: [`${particle.x}%`, `${(particle.x + 30) % 100}%`, `${particle.x}%`],
              y: [`${particle.y}%`, `${(particle.y - 20) % 100}%`, `${particle.y}%`],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <div className={Style.searchWrapper}>
        {/* Premium Header */}
        <motion.div 
          className={Style.searchHeader}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className={Style.premium_badge}>
            <MdVerified className={Style.verified_icon} />
            <span>Premium Gold NFT Marketplace</span>
          </div>

          <h1 className={Style.searchTitle}>
            <span className={Style.gold_text}>Explore</span> Gold NFTs
          </h1>

          <p className={Style.searchDescription}>
            Discover exclusive physical gold-backed NFTs from certified vaults worldwide.
            Each NFT represents real gold stored with complete transparency and security.
          </p>

          {/* Live Stats Grid */}
          <div className={Style.stats_grid}>
            <motion.div 
              className={Style.stat_card}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <GiGoldBar className={Style.stat_icon} />
              <div className={Style.stat_info}>
                <span className={Style.stat_label}>Total Value</span>
                <span className={Style.stat_value}>{stats.totalValue} ETH</span>
              </div>
            </motion.div>

            <motion.div 
              className={Style.stat_card}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FaChartLine className={Style.stat_icon} />
              <div className={Style.stat_info}>
                <span className={Style.stat_label}>Avg Price</span>
                <span className={Style.stat_value}>{stats.avgPrice} ETH</span>
              </div>
            </motion.div>

            <motion.div 
              className={Style.stat_card}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FaShieldAlt className={Style.stat_icon} />
              <div className={Style.stat_info}>
                <span className={Style.stat_label}>Available NFTs</span>
                <span className={Style.stat_value}>{stats.totalNFTs}</span>
              </div>
            </motion.div>

            <motion.div 
              className={Style.stat_card}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FaCoins className={Style.stat_icon} />
              <div className={Style.stat_info}>
                <span className={Style.stat_label}>Market Volume</span>
                <span className={Style.stat_value}>{stats.marketVolume} ETH</span>
              </div>
            </motion.div>
          </div>

          {/* Sell Button */}
          <div className={Style.sellBtnWrapper}>
            <Button btnName="Sell Your Gold" handleClick={openSellModal} />
          </div>
        </motion.div>

        {/* Premium Filter Bar */}
        <motion.div 
          className={Style.filterBar}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className={Style.filterGroup}>
            <label className={Style.filterLabel}>
              <FaCoins className={Style.filterIcon} />
              Price Range (ETH)
            </label>
            <div className={Style.priceInputs}>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                step="0.01"
                min="0"
                className={Style.priceInput}
              />
              <span className={Style.priceSeparator}>to</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                step="0.01"
                min="0"
                className={Style.priceInput}
              />
            </div>
          </div>

          <div className={Style.filterGroup}>
            <label className={Style.filterLabel}>
              <FaSort className={Style.filterIcon} />
              Sort By
            </label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className={Style.filterSelect}
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <div className={Style.filterGroup}>
            <label className={Style.filterLabel}>
              <FaFilter className={Style.filterIcon} />
              Market Type
            </label>
            <select 
              value={marketType} 
              onChange={(e) => setMarketType(e.target.value)}
              className={Style.filterSelect}
            >
              <option value="all">All NFTs</option>
              <option value="primary">Primary Market</option>
              <option value="secondary">Secondary Market</option>
            </select>
          </div>

          <button 
            className={Style.clearBtn}
            onClick={clearFilters}
          >
            <FaSearch className={Style.clearIcon} />
            Clear Filters
          </button>
        </motion.div>

        {/* NFT Grid */}
        {marketplaceLoading ? (
          <motion.div 
            className={Style.loadingContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader />
            <div className={Style.loadingText}>
              Loading premium gold NFTs...
            </div>
          </motion.div>
        ) : filteredNFTs.length === 0 ? (
          <motion.div 
            className={Style.emptyState}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className={Style.emptyIcon}>🔍</div>
            <h3 className={Style.emptyTitle}>No NFTs Found</h3>
            <p className={Style.emptyDescription}>
              Try adjusting your filters to discover more premium gold assets
            </p>
          </motion.div>
        ) : (
          <motion.div 
            className={Style.nftGrid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {filteredNFTs.map((nft, index) => (
              <motion.div 
                key={nft.tokenId} 
                className={Style.nftCard}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className={Style.nftImageContainer}>
                  <div className={Style.nftImage}>
                    <img src={nft.image} alt={nft.name} />
                  </div>
                  <div className={Style.nftBadge}>
                    <span className={Style.badgeText}>Gold NFT</span>
                    <span className={Style.badgeSubtext}>99.99% Pure</span>
                  </div>
                  {/* NOUVEAU : Badge pour les NFTs listés par l'utilisateur */}
                  {isUserSeller(nft) && (
                    <div className={Style.ownerBadge}>
                      <span>Your Listing</span>
                    </div>
                  )}
                </div>
                
                <div className={Style.nftInfo}>
                  <h3 className={Style.nftTitle}>💎 {nft.name}</h3>
                  
                  <div className={Style.nftDetails}>
                    <div className={Style.priceSection}>
                      <span className={Style.detailLabel}>Price</span>
                      <span className={Style.priceValue}>{nft.price} ETH</span>
                    </div>
                    <div className={Style.tokenSection}>
                      <span className={Style.detailLabel}>Token ID</span>
                      <span className={Style.tokenId}>#{nft.tokenId}</span>
                    </div>
                  </div>
                  
                  <div className={Style.sellerInfo}>
                    <span className={Style.detailLabel}>👤 Seller</span>
                    <span className={Style.sellerAddress}>
                      {nft.seller.slice(0, 6)}...{nft.seller.slice(-4)}
                    </span>
                  </div>
                  
                  <div className={Style.actionButtons}>
                    {!nft.sold && currentAccount && !isUserSeller(nft) && (
                    <button 
                      className={Style.buyBtn}
                      onClick={() => handleBuyNFT(nft)}
                    >
                      🚀 Buy Now
                    </button>
                  )}
                    
                    {/* Cancel Listing button for user's NFTs */}
                    {!nft.sold && currentAccount && isUserSeller(nft) && (
                      <button 
                        className={Style.cancelBtn}
                        onClick={() => handleCancelListing(nft)}
                      >
                        <FaTimes /> Cancel Listing
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Sell NFT Modal */}
      {showSellModal && (
        <SellNFTModal
          nfts={myNFTs}
          royaltyInfo={royaltyInfo}
          onClose={() => setShowSellModal(false)}
          onSell={(nft, price) => handleSellNFT(nft, price)}
        />
      )}
    </div>
  );
};

export default SearchPage;
