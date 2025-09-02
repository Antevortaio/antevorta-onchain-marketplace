import React, { useState, useEffect, useContext } from "react";

//INTERNAL IMPORT
import Style from "../styles/index.module.css";
import {
  HeroSection,
  GoldStrategy,
} from "../components/componentsindex";

//IMPORTING CONTRCT DATA
import { NFTMarketplaceContext } from "../Context/NFTMarketplaceContext";

const Home = () => {
  const { checkIfWalletConnected, currentAccount } = useContext(
    NFTMarketplaceContext
  );
  useEffect(() => {
    checkIfWalletConnected();
  }, []);

  return (
    <div className={Style.homePage}>
      <HeroSection />
      <GoldStrategy />
    </div>
  );
};

export default Home;
