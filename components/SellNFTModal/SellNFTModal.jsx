import React, { useState, useEffect } from "react";
import Image from "next/image";
import Style from "./SellNFTModal.module.css";

const SellNFTModal = ({ nfts, royaltyInfo, onClose, onSell }) => {
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [price, setPrice] = useState("");
  const [netAmount, setNetAmount] = useState("0");

  useEffect(() => {
    if (selectedNFT && price && royaltyInfo) {
      const feePercentage = royaltyInfo.fee / 100; // fee in %
      const gross = parseFloat(price) || 0;
      const net = gross * (1 - feePercentage / 100);
      setNetAmount(net.toFixed(3));
    } else {
      setNetAmount("0");
    }
  }, [selectedNFT, price, royaltyInfo]);

  const handleSell = () => {
    if (!selectedNFT || !price) return;
    onSell(selectedNFT, price);
  };

  return (
    <div className={Style.modalBackdrop}>
      <div className={Style.modalContent}>
        <button className={Style.closeBtn} onClick={onClose}>
          &times;
        </button>
        <h2 className={Style.modalTitle}>Sell Your Gold NFT</h2>

        <label className={Style.label}>Choose NFT</label>
        <select
          className={Style.select}
          value={selectedNFT ? selectedNFT.tokenId : ""}
          onChange={(e) => {
            const nft = nfts.find((item) => item.tokenId.toString() === e.target.value);
            setSelectedNFT(nft);
          }}
        >
          <option value="" disabled>
            Select your NFT
          </option>
          {nfts.map((nft) => (
            <option key={nft.tokenId} value={nft.tokenId}>
              {nft.name || `NFT #${nft.tokenId}`}
            </option>
          ))}
        </select>

        {selectedNFT && (
          <div className={Style.nftPreview}>
            {selectedNFT.image ? (
              <Image src={selectedNFT.image} alt="NFT Preview" width={120} height={120} />
            ) : (
              <div className={Style.noImage}>
                <p>No image available</p>
              </div>
            )}
            <div>
              <p>{selectedNFT.name || `NFT #${selectedNFT.tokenId}`}</p>
              <p>Token ID: {selectedNFT.tokenId}</p>
            </div>
          </div>
        )}

        <label className={Style.label}>Price (ETH)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          className={Style.input}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        {royaltyInfo && (
          <p className={Style.feeInfo}>
            Royalty Fee: {royaltyInfo.feePercentage}% | You will receive: {netAmount} ETH
          </p>
        )}

        <button className={Style.sellBtn} onClick={handleSell} disabled={!selectedNFT || !price}>
          List for Sale
        </button>
      </div>
    </div>
  );
};

export default SellNFTModal; 