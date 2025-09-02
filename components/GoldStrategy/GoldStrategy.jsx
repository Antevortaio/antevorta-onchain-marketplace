import React, { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

//INTERNAL IMPORT
import Style from "./GoldStrategy.module.css";

const GoldStrategy = () => {
  useEffect(() => {
    // Animation des barres de progression au chargement
    const progressBars = document.querySelectorAll(`.${Style.progress_bar}`);
    progressBars.forEach((bar, index) => {
      const width = bar.getAttribute('data-width');
      bar.style.width = '0%';
      setTimeout(() => {
        bar.style.width = width;
      }, 200 + (index * 100));
    });
  }, []);

  const goldCoins = [
    {
      title: "Napoleon 20 Francs",
      year: "(1855)",
      image: "/img/gold1.png",
      stats: {
        rarity: 82,
        appreciation: 89,
        volatility: 60,
        historical: 85
      }
    },
    {
      title: "Mexican Onza 50 Pesos",
      year: "(1947)",
      image: "/img/gold2.png",
      stats: {
        rarity: 65,
        appreciation: 62,
        volatility: 70,
        historical: 72
      }
    },
    {
      title: "Krugerrand 1 oz",
      year: "(1967)",
      image: "/img/gold3.png",
      stats: {
        rarity: 30,
        appreciation: 71,
        volatility: 75,
        historical: 75
      }
    }
  ];

  return (
    <div className={Style.goldStrategy}>
      {/* Subtle gold particles background */}
      <div className={Style.particlesContainer}>
        {Array.from({ length: 8 }, (_, i) => (
          <motion.div
            key={i}
            className={Style.goldParticle}
            initial={{ 
              x: `${Math.random() * 100}%`, 
              y: `${Math.random() * 100}%`,
              opacity: 0
            }}
            animate={{
              x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
              y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
              opacity: [0, 0.4, 0]
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>
      
      <div className={Style.container}>
        <motion.div
          className={Style.section_header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className={Style.heroSection_title}>
            <span className={Style.gold_text}>Pick the gold piece that</span>
            <span className={Style.white_text}> suits your strategy</span>
          </h2>
          <motion.p 
            className={Style.heroSection_description}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Who said gold was boring? Welcome to the future of precious metals
          </motion.p>
        </motion.div>

        <div className={Style.cards_container}>
          {goldCoins.map((coin, index) => (
            <motion.div
              key={index}
              className={Style.nft_card}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className={Style.card_header}>
                <h3 className={Style.coin_title}>{coin.title}</h3>
                <p className={Style.coin_year}>{coin.year}</p>
              </div>

              <div className={Style.image_placeholder}>
                <Image
                  src={coin.image}
                  alt={coin.title}
                  width={120}
                  height={120}
                  className={Style.coin_image}
                  priority={index < 2}
                />
              </div>

              <div className={Style.stats_container}>
                <div className={Style.stat_item}>
                  <span className={Style.stat_label}>Rarity</span>
                  <div className={Style.progress_container}>
                    <div 
                      className={`${Style.progress_bar} ${Style.rarity}`} 
                      data-width={`${coin.stats.rarity}%`}
                    ></div>
                    <span className={Style.progress_percentage}>{coin.stats.rarity}%</span>
                  </div>
                </div>

                <div className={Style.stat_item}>
                  <span className={Style.stat_label}>Appreciation</span>
                  <div className={Style.progress_container}>
                    <div 
                      className={`${Style.progress_bar} ${Style.appreciation}`} 
                      data-width={`${coin.stats.appreciation}%`}
                    ></div>
                    <span className={Style.progress_percentage}>{coin.stats.appreciation}%</span>
                  </div>
                </div>

                <div className={Style.stat_item}>
                  <span className={Style.stat_label}>Volatility</span>
                  <div className={Style.progress_container}>
                    <div 
                      className={`${Style.progress_bar} ${Style.volatility}`} 
                      data-width={`${coin.stats.volatility}%`}
                    ></div>
                    <span className={Style.progress_percentage}>{coin.stats.volatility}%</span>
                  </div>
                </div>

                <div className={Style.stat_item}>
                  <span className={Style.stat_label}>Historical Value</span>
                  <div className={Style.progress_container}>
                    <div 
                      className={`${Style.progress_bar} ${Style.historical}`} 
                      data-width={`${coin.stats.historical}%`}
                    ></div>
                    <span className={Style.progress_percentage}>{coin.stats.historical}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoldStrategy; 