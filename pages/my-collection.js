import React, { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/router";
import { GiGoldBar } from "react-icons/gi";
import { FaChartLine, FaShieldAlt, FaLock, FaTimes } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

//INTERNAL IMPORT
import Style from "../styles/myCollection.module.css";
import images from "../public/img";

//IMPORTING CONTRACT DATA
import { NFTMarketplaceContext } from "../Context/NFTMarketplaceContext";

const MyCollection = () => {
  const context = useContext(NFTMarketplaceContext);
  const router = useRouter();
  const [userNFTs, setUserNFTs] = useState([]);
  const [listedNFTs, setListedNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("owned"); // "owned" or "listed"
  const [stats, setStats] = useState({
    totalValue: "0",
    nftCount: "0",
    avgPrice: "0"
  });

  // Vérifier que le contexte est disponible
  if (!context) {
    console.error("NFTMarketplaceContext is not available");
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'white',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)'
      }}>
        <div>Loading context...</div>
      </div>
    );
  }

  const { currentAccount, fetchMyNFTsOrListedNFTs, cancelListing } = context;

  useEffect(() => {
    if (!currentAccount) {
      router.push("/");
      return;
    }

    const loadUserCollection = async () => {
      try {
        setLoading(true);
        
        // Vérifier que fetchMyNFTsOrListedNFTs est disponible
        if (!fetchMyNFTsOrListedNFTs) {
          console.error("fetchMyNFTsOrListedNFTs is not available");
          setLoading(false);
          return;
        }

        // Récupérer les NFTs possédés et listés
        const [userOwnedNFTs, userListedNFTs] = await Promise.all([
          fetchMyNFTsOrListedNFTs("fetchMyNFTs"),
          fetchMyNFTsOrListedNFTs("fetchItemsListed")
        ]);
        
        // Vérifier que les résultats sont des tableaux
        if (!Array.isArray(userOwnedNFTs)) {
          console.error("fetchMyNFTsOrListedNFTs did not return an array for owned NFTs:", userOwnedNFTs);
          setUserNFTs([]);
        } else {
          setUserNFTs(userOwnedNFTs);
        }

        if (!Array.isArray(userListedNFTs)) {
          console.error("fetchMyNFTsOrListedNFTs did not return an array for listed NFTs:", userListedNFTs);
          setListedNFTs([]);
        } else {
          setListedNFTs(userListedNFTs);
        }

        console.log("User owned NFTs:", userOwnedNFTs);
        console.log("User listed NFTs:", userListedNFTs);
        
        // Calculer les statistiques basées sur les NFTs possédés
        const totalValue = (userOwnedNFTs || []).reduce((sum, nft) => {
          const price = parseFloat(nft.price || 0);
          return sum + price;
        }, 0);
        
        const avgPrice = (userOwnedNFTs || []).length > 0 ? (totalValue / userOwnedNFTs.length).toFixed(3) : "0";
        
        setStats({
          totalValue: totalValue.toFixed(2),
          nftCount: (userOwnedNFTs || []).length.toString(),
          avgPrice: avgPrice
        });
      } catch (error) {
        console.error("Error loading user collection:", error);
        setUserNFTs([]);
        setListedNFTs([]);
        setStats({
          totalValue: "0",
          nftCount: "0",
          avgPrice: "0"
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserCollection();
  }, [currentAccount, fetchMyNFTsOrListedNFTs, router]);

  const handleCancelListing = async (tokenId) => {
    if (!confirm("Are you sure you want to cancel this listing? The NFT will be returned to your collection.")) {
      return;
    }

    try {
      const result = await cancelListing(tokenId);
      if (result.success) {
        // Recharger les données
        const loadUserCollection = async () => {
          const [userOwnedNFTs, userListedNFTs] = await Promise.all([
            fetchMyNFTsOrListedNFTs("fetchMyNFTs"),
            fetchMyNFTsOrListedNFTs("fetchItemsListed")
          ]);
          setUserNFTs(userOwnedNFTs || []);
          setListedNFTs(userListedNFTs || []);
        };
        await loadUserCollection();
        alert("Listing cancelled successfully!");
      }
    } catch (error) {
      console.error("Error cancelling listing:", error);
    }
  };

  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 15 + Math.random() * 20
  }));

  if (!currentAccount) {
    return null;
  }

  return (
    <div className={Style.myCollection}>
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

      <div className={Style.container}>
        {/* Header Section */}
        <motion.div 
          className={Style.header}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className={Style.premium_badge}>
            <MdVerified className={Style.verified_icon} />
            <span>Your Personal Gold Vault</span>
          </div>

          <h1 className={Style.main_title}>
            <span className={Style.gold_text}>My Gold Collection</span>
          </h1>

          <p className={Style.subtitle}>
            Discover your precious metals portfolio, securely stored and beautifully presented
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className={Style.stats_grid}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
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
              <span className={Style.stat_label}>Collection Size</span>
              <span className={Style.stat_value}>{stats.nftCount} Pieces</span>
            </div>
          </motion.div>

          <motion.div 
            className={Style.stat_card}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <FaShieldAlt className={Style.stat_icon} />
            <div className={Style.stat_info}>
              <span className={Style.stat_label}>Average Price</span>
              <span className={Style.stat_value}>{stats.avgPrice} ETH</span>
            </div>
          </motion.div>

          <motion.div 
            className={Style.stat_card}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <FaLock className={Style.stat_icon} />
            <div className={Style.stat_info}>
              <span className={Style.stat_label}>Security Status</span>
              <span className={Style.stat_value}>Secured</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          className={Style.tabs_container}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className={Style.tabs}>
            <button
              className={`${Style.tab} ${activeTab === "owned" ? Style.active : ""}`}
              onClick={() => setActiveTab("owned")}
            >
              My Collection ({userNFTs.length})
            </button>
            <button
              className={`${Style.tab} ${activeTab === "listed" ? Style.active : ""}`}
              onClick={() => setActiveTab("listed")}
            >
              Listed for Sale ({listedNFTs.length})
            </button>
          </div>
        </motion.div>

        {/* Collection Grid */}
        <motion.div 
          className={Style.collection_section}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2 className={Style.section_title}>
            {activeTab === "owned" ? "Your Precious Metals" : "Listed for Sale"}
          </h2>
          
          {loading ? (
            <div className={Style.loading_container}>
              <div className={Style.loading_spinner}></div>
              <p>Loading your collection...</p>
            </div>
          ) : (activeTab === "owned" ? userNFTs : listedNFTs).length === 0 ? (
            <div className={Style.empty_state}>
              <GiGoldBar className={Style.empty_icon} />
              <h3>
                {activeTab === "owned" 
                  ? "Your collection is empty" 
                  : "No NFTs listed for sale"
                }
              </h3>
              <p>
                {activeTab === "owned"
                  ? "Start building your gold portfolio by exploring our marketplace"
                  : "List your NFTs for sale to start earning"
                }
              </p>
              <button 
                className={Style.explore_button}
                onClick={() => router.push("/searchPage")}
              >
                Explore Marketplace
              </button>
            </div>
          ) : (
            <div className={Style.collection_grid}>
              {(activeTab === "owned" ? userNFTs : listedNFTs).map((nft, index) => (
                <motion.div
                  key={nft.tokenId}
                  className={Style.nft_card}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className={Style.card_image_container}>
                    <Image
                      src={nft.image || images.hero}
                      alt={nft.name || "Gold NFT"}
                      width={300}
                      height={300}
                      className={Style.card_image}
                      objectFit="cover"
                    />
                    <div className={Style.card_overlay}>
                      <div className={Style.card_badge}>
                        <span className={Style.badge_text}>1 oz</span>
                        <span className={Style.badge_subtext}>99.99% Pure</span>
                      </div>
                      {activeTab === "listed" && (
                        <div className={Style.listed_badge}>
                          <span>Listed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={Style.card_content}>
                    <h3 className={Style.nft_name}>{nft.name || "Gold Piece"}</h3>
                    <p className={Style.nft_description}>
                      {nft.description || "Premium physical gold stored in certified vaults"}
                    </p>
                    
                    <div className={Style.nft_details}>
                      <div className={Style.detail_item}>
                        <span className={Style.detail_label}>Price</span>
                        <span className={Style.detail_value}>{nft.price} ETH</span>
                      </div>
                      <div className={Style.detail_item}>
                        <span className={Style.detail_label}>Token ID</span>
                        <span className={Style.detail_value}>#{nft.tokenId}</span>
                      </div>
                    </div>

                    <div className={Style.card_actions}>
                      {activeTab === "listed" ? (
                        <button 
                          className={Style.cancel_button}
                          onClick={() => handleCancelListing(nft.tokenId)}
                        >
                          <FaTimes /> Cancel Listing
                        </button>
                      ) : (
                      <button className={Style.view_button}>
                        View Details
                      </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MyCollection; 