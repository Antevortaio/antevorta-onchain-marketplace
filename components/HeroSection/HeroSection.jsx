import React, { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaShieldAlt, FaChartLine, FaLock } from "react-icons/fa";
import { GiGoldBar } from "react-icons/gi";
import { MdVerified } from "react-icons/md";

//INTERNAL IMPORT
import Style from "./HeroSection.module.css";
import images from "../../public/img";
import { Button } from "../componentsindex";
import { NFTMarketplaceContext } from "../../Context/NFTMarketplaceContext";

const HeroSection = () => {
  const { titleData, fetchGoldNFTs } = useContext(NFTMarketplaceContext);
  const router = useRouter();
  const [stats, setStats] = useState({
    totalValue: "0",
    nftCount: "0",
    vaultCapacity: "0",
    avgPrice: "0"
  });
  const [goldPrice, setGoldPrice] = useState(3000.00); // Prix initial autour de 3000$

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const items = await fetchGoldNFTs();
        const totalNFTs = items?.length || 0;
        const totalValue = items?.reduce((sum, item) => sum + parseFloat(item.price || 0), 0) || 0;
        const avgPrice = totalNFTs > 0 ? (totalValue / totalNFTs).toFixed(3) : "0";
        
        setStats({
          totalValue: totalValue.toFixed(2),
          nftCount: totalNFTs.toString(),
          vaultCapacity: "50000",
          avgPrice: avgPrice
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
    
    // Simulation de prix autour de 3000$ avec variations aléatoires
    const interval = setInterval(() => {
      setGoldPrice(prev => prev + (Math.random() - 0.5) * 10);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchGoldNFTs]);

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 15 + Math.random() * 20
  }));

  return (
    <div className={Style.heroSection}>
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

      <div className={Style.heroSection_wrapper}>
        <div className={Style.heroSection_content}>
          <motion.div 
            className={Style.heroSection_left}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className={Style.premium_badge}>
              <MdVerified className={Style.verified_icon} />
              <span>Vault-Secured Physical Gold</span>
            </div>

            <h1 className={Style.heroSection_title}>
              <span className={Style.gold_text}>Own Real Gold</span>
              <br />
              Through NFTs
            </h1>

            <p className={Style.heroSection_description}>
              Each NFT represents physical gold stored in certified vaults worldwide.
              Trade, hold, and redeem your digital gold with complete transparency.
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
                  <span className={Style.stat_label}>Total Value Locked</span>
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
                  <span className={Style.stat_label}>Gold Price/oz</span>
                  <span className={Style.stat_value}>${goldPrice.toFixed(2)}</span>
                </div>
              </motion.div>

              <motion.div 
                className={Style.stat_card}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <FaShieldAlt className={Style.stat_icon} />
                <div className={Style.stat_info}>
                  <span className={Style.stat_label}>Secured NFTs</span>
                  <span className={Style.stat_value}>{stats.nftCount}</span>
                </div>
              </motion.div>

              <motion.div 
                className={Style.stat_card}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <FaLock className={Style.stat_icon} />
                <div className={Style.stat_info}>
                  <span className={Style.stat_label}>Vault Capacity</span>
                  <span className={Style.stat_value}>{stats.vaultCapacity} oz</span>
                </div>
              </motion.div>
            </div>

            <div className={Style.heroSection_buttons}>
          <Button
                btnName="Explore NFTs" 
            handleClick={() => router.push("/searchPage")}
                classStyle={Style.primaryButton}
              />
              <Button 
                btnName="Learn More" 
                handleClick={() => router.push("/aboutus")}
                classStyle={Style.secondaryButton}
          />
        </div>

            {/* Trust Indicators */}
            <div className={Style.trust_indicators}>
              <div className={Style.trust_item}>
                <MdVerified className={Style.trust_icon} />
                <span>LBMA Certified</span>
              </div>
              <div className={Style.trust_item}>
                <MdVerified className={Style.trust_icon} />
                <span>Insured Vaults</span>
              </div>
              <div className={Style.trust_item}>
                <MdVerified className={Style.trust_icon} />
                <span>24/7 Security</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className={Style.heroSection_right}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className={Style.goldbar_showcase}>
              <div className={Style.showcase_glow}></div>
          <Image
            src={images.hero}
                alt="Premium Gold NFT"
            width={800}
            height={800}
            unoptimized
            quality={100}
            objectFit="contain"
                className={Style.showcase_image}
              />
              <motion.div 
                className={Style.showcase_badge}
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, 1, 0]
                }}
                transition={{ 
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                <span className={Style.badge_text}>1 oz</span>
                <span className={Style.badge_subtext}>99.99% Pure</span>
              </motion.div>
              
              {/* Floating info cards */}
              <motion.div 
                className={Style.float_card_1}
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 2, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <span className={Style.float_label}>Current Bid</span>
                <span className={Style.float_value}>12.5 ETH</span>
              </motion.div>

              <motion.div 
                className={Style.float_card_2}
                animate={{ 
                  y: [0, 10, 0],
                  rotate: [0, -2, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              >
                <span className={Style.float_label}>Vault Location</span>
                <span className={Style.float_value}>Swiss Alps</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
