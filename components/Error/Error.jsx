import React, { useState, useEffect, useContext } from "react";
import Image from "next/image";

//INTERNAL IMPORT
import Style from "./Error.module.css";
import images from "../../public/img";

//SMAFRT CONTRCAT IMPORT CONTEXT
import { NFTMarketplaceContext } from "../../Context/NFTMarketplaceContext";

const Error = () => {
  const { error, setOpenError } = useContext(NFTMarketplaceContext);
  
  const getErrorInfo = (errorMessage) => {
    // Categorize errors for better UX
    if (errorMessage.includes("MetaMask")) {
      return {
        icon: "🔗",
        title: "Wallet Connection Required",
        category: "wallet",
        action: "Install MetaMask"
      };
    }
    if (errorMessage.includes("network") || errorMessage.includes("Network")) {
      return {
        icon: "🌐",
        title: "Network Issue",
        category: "network",
        action: "Switch Network"
      };
    }
    if (errorMessage.includes("rejected") || errorMessage.includes("failed")) {
      return {
        icon: "❌",
        title: "Transaction Failed",
        category: "transaction",
        action: "Try Again"
      };
    }
    if (errorMessage.includes("balance")) {
      return {
        icon: "💰",
        title: "Insufficient Balance",
        category: "balance",
        action: "Check Balance"
      };
    }
    if (errorMessage.includes("upload")) {
      return {
        icon: "📤",
        title: "Upload Failed",
        category: "upload",
        action: "Retry Upload"
      };
    }
    if (errorMessage.includes("load") || errorMessage.includes("fetch")) {
      return {
        icon: "🔄",
        title: "Loading Error",
        category: "loading",
        action: "Refresh Page"
      };
    }
    if (errorMessage.includes("settings") || errorMessage.includes("royalty")) {
      return {
        icon: "⚙️",
        title: "Settings Update Failed",
        category: "settings",
        action: "Try Again"
      };
    }
    // Default error
    return {
      icon: "⚠️",
      title: "Something Went Wrong",
      category: "general",
      action: "Try Again"
    };
  };

  const handleAction = () => {
    const errorInfo = getErrorInfo(error);
    
    switch (errorInfo.category) {
      case "wallet":
        window.open("https://metamask.io/download/", "_blank");
        break;
      case "network":
        // Trigger network switch
        window.location.reload();
        break;
      case "loading":
        window.location.reload();
        break;
      default:
        setOpenError(false);
        break;
    }
  };

  const errorInfo = getErrorInfo(error);

  return (
    <div className={Style.Error} onClick={() => setOpenError(false)}>
      <div className={Style.Error_box}>
        <div className={Style.Error_box_info}>
          <div className={Style.Error_box_info_icon}>
            {errorInfo.icon}
          </div>
          <h3>{errorInfo.title}</h3>
          <p>{error}</p>
          <div className={Style.Error_box_info_actions}>
            <button onClick={() => setOpenError(false)}>Close</button>
            <button onClick={handleAction} className={Style.primaryAction}>
              {errorInfo.action}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Error;
