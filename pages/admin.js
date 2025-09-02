import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { ethers } from "ethers";

//INTERNAL IMPORT
import Style from "../styles/admin.module.css";
import { Button, Error, Loader } from "../components/componentsindex";
import { NFTMarketplaceContext } from "../Context/NFTMarketplaceContext";

const AdminPanel = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [formInput, setFormInput] = useState({
    name: "",
    description: "",
  });
  const [fileUrl, setFileUrl] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [royaltyFee, setRoyaltyFee] = useState("");
  const [royaltyReceiver, setRoyaltyReceiver] = useState("");
  const [currentRoyaltyInfo, setCurrentRoyaltyInfo] = useState({ 
    fee: 0, 
    receiver: "", 
    feePercentage: "0.00" 
  });
  const [contractStats, setContractStats] = useState({
    totalMinted: 0,
    totalListed: 0,
    available: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // New admin function states
  const [burnAddress, setBurnAddressInput] = useState("");
  const [recoveryAddress, setRecoveryAddressInput] = useState("");
  const [recoveryTokenId, setRecoveryTokenId] = useState("");
  const [recoveryFromAddress, setRecoveryFromAddress] = useState("");
  const [updateTokenId, setUpdateTokenId] = useState("");
  const [updateFormInput, setUpdateFormInput] = useState({
    name: "",
    description: "",
  });
  const [updateFileUrl, setUpdateFileUrl] = useState(null);
  const [updatePreviewImage, setUpdatePreviewImage] = useState(null);
  
  // Seaport listing states
  const [listTokenId, setListTokenId] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [userNFTs, setUserNFTs] = useState([]);

  const {
    uploadToPinata,
    adminMintNFT,
    updateRoyaltyFeeBps,
    updateRoyaltyReceiver,
    getRoyaltyInfo,
    getContractStats,
    setBurnAddress,
    setVaultRecoveryAddress,
    recoverGoldToken,
    updateGoldMetadata,
    createSeaportListing,
    currentAccount,
    isOwner,
    loading,
    openError,
    isPaused,
    togglePause,
    getUserNFTs,
  } = useContext(NFTMarketplaceContext);

  useEffect(() => {
    if (!currentAccount) {
      router.push("/");
      return;
    }
    if (!isOwner) {
      router.push("/");
      return;
    }
    loadAdminData();
  }, [currentAccount, isOwner]);

  const loadAdminData = async () => {
    try {
      const [royaltyInfo, stats, nfts] = await Promise.all([
        getRoyaltyInfo(),
        getContractStats(),
        getUserNFTs()
      ]);
      
      setCurrentRoyaltyInfo(royaltyInfo);
      setRoyaltyFee(royaltyInfo.fee.toString());
      setRoyaltyReceiver(royaltyInfo.receiver);
      setContractStats(stats);
      setUserNFTs(nfts || []);
    } catch (error) {
      console.error("Error loading admin data:", error);
      
      // Données par défaut en cas d'erreur
      setCurrentRoyaltyInfo({ fee: 0, receiver: "", feePercentage: "0.00" });
      setContractStats({ totalMinted: 0, totalSold: 0, available: 0 });
      setUserNFTs([]);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image size must be less than 10MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);

    try {
      const url = await uploadToPinata(file);
      setFileUrl(url);
    } catch (error) {
      console.error("Error uploading image:", error);
      setPreviewImage(null);
    }
  };

  const validateMintForm = () => {
    const { name, description } = formInput;
    
    if (!name.trim()) {
      alert("NFT name is required");
      return false;
    }
    
    if (name.trim().length < 3) {
      alert("NFT name must be at least 3 characters");
      return false;
    }
    
    if (!description.trim()) {
      alert("NFT description is required");
      return false;
    }
    
    if (description.trim().length < 10) {
      alert("Description must be at least 10 characters");
      return false;
    }
    
    if (!fileUrl) {
      alert("Please upload an image");
      return false;
    }
    
    return true;
  };

  const mintNFT = async () => {
    if (!validateMintForm()) return;

    setIsSubmitting(true);
    try {
      const { name, description } = formInput;
      const result = await adminMintNFT(name, description, fileUrl);
      
      if (result.success) {
        setSuccessMessage("Gold NFT minted successfully!");
        setFormInput({ name: "", description: "" });
        setFileUrl(null);
        setPreviewImage(null);
        
        // Wait a bit then reload data to reflect the new NFT
        setTimeout(async () => {
          await loadAdminData(); // Refresh stats
        }, 2000);
        
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateRoyaltyForm = () => {
    if (!royaltyFee || isNaN(royaltyFee)) {
      alert("Please enter a valid royalty fee (in basis points)");
      return false;
    }
    
    const fee = parseInt(royaltyFee);
    if (fee < 0 || fee > 1000) {
      alert("Royalty fee must be between 0 and 1000 basis points (0-10%)");
      return false;
    }
    
    if (!royaltyReceiver || !ethers.utils.isAddress(royaltyReceiver)) {
      alert("Please enter a valid Ethereum address for royalty receiver");
      return false;
    }
    
    return true;
  };

  const updateRoyalty = async () => {
    if (!validateRoyaltyForm()) return;

    setIsSubmitting(true);
    try {
      const [feeResult, receiverResult] = await Promise.all([
        updateRoyaltyFeeBps(parseInt(royaltyFee)),
        updateRoyaltyReceiver(royaltyReceiver)
      ]);
      
      if (feeResult.success && receiverResult.success) {
        setSuccessMessage("Royalty settings updated successfully!");
        await loadAdminData();
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error updating royalty:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormInput({ name: "", description: "" });
    setFileUrl(null);
    setPreviewImage(null);
  };

  // New admin functions
  const handleSetBurnAddress = async () => {
    if (!burnAddress || !ethers.utils.isAddress(burnAddress)) {
      alert("Please enter a valid Ethereum address");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await setBurnAddress(burnAddress);
      if (result.success) {
        setSuccessMessage("Burn address updated successfully!");
        setBurnAddressInput("");
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error setting burn address:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetRecoveryAddress = async () => {
    if (!recoveryAddress || !ethers.utils.isAddress(recoveryAddress)) {
      alert("Please enter a valid Ethereum address");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await setVaultRecoveryAddress(recoveryAddress);
      if (result.success) {
        setSuccessMessage("Vault recovery address updated successfully!");
        setRecoveryAddressInput("");
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error setting recovery address:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoverToken = async () => {
    if (!recoveryFromAddress || !ethers.utils.isAddress(recoveryFromAddress)) {
      alert("Please enter a valid Ethereum address");
      return;
    }
    if (!recoveryTokenId || isNaN(recoveryTokenId)) {
      alert("Please enter a valid token ID");
      return;
    }

    if (!confirm("Are you sure you want to recover this token? This action cannot be undone.")) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await recoverGoldToken(recoveryFromAddress, parseInt(recoveryTokenId));
      if (result.success) {
        setSuccessMessage("Token recovered successfully!");
        setRecoveryFromAddress("");
        setRecoveryTokenId("");
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error recovering token:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMetadata = async () => {
    if (!updateTokenId || isNaN(updateTokenId)) {
      alert("Please enter a valid token ID");
      return;
    }
    if (!updateFormInput.name.trim() || !updateFormInput.description.trim()) {
      alert("Please fill in name and description");
      return;
    }
    if (!updateFileUrl) {
      alert("Please upload an image");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateGoldMetadata(
        parseInt(updateTokenId),
        updateFormInput.name,
        updateFormInput.description,
        updateFileUrl
      );
      if (result.success) {
        setSuccessMessage("Token metadata updated successfully!");
        setUpdateTokenId("");
        setUpdateFormInput({ name: "", description: "" });
        setUpdateFileUrl(null);
        setUpdatePreviewImage(null);
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error updating metadata:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleListNFT = async () => {
    if (!listTokenId || isNaN(listTokenId)) {
      alert("Please select a valid NFT");
      return;
    }
    
    if (!listPrice || isNaN(listPrice) || parseFloat(listPrice) <= 0) {
      alert("Please enter a valid price");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createSeaportListing(parseInt(listTokenId), listPrice);
      if (result.success) {
        setSuccessMessage("NFT listed for sale successfully!");
        setListTokenId("");
        setListPrice("");
        // Refresh data to show updated listings
        setTimeout(async () => {
          await loadAdminData();
        }, 2000);
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error listing NFT:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentAccount || !isOwner) {
    return (
      <div className={Style.adminPanel}>
        <div className={Style.accessDenied}>
          <div className={Style.accessDeniedContent}>
            <h1>🔒 Access Denied</h1>
            <p>Only the contract owner can access this admin panel.</p>
            <Button btnName="Go Home" handleClick={() => router.push("/")} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={Style.adminPanel}>
      <div className={Style.adminPanel_container}>
        <div className={Style.adminPanel_header}>
          <h1>🛡️ Admin Panel</h1>
          <p>Manage your NFT marketplace with full control</p>
          <div className={Style.adminBadge}>
            <span>👑 Contract Owner</span>
          </div>
          <button
            className={`${Style.pauseButton} ${isPaused ? Style.paused : ""}`}
            onClick={togglePause}
            disabled={loading}
          >
            {isPaused ? "🟢 Resume Marketplace" : "🔴 Stop Marketplace"}
          </button>
        </div>

        {isPaused && (
          <div className={Style.pauseBanner}>
            ⚠️ Marketplace is currently paused. All transactions are disabled.
          </div>
        )}

        {successMessage && (
          <div className={Style.successMessage}>
            ✅ {successMessage}
          </div>
        )}

        <div className={Style.adminPanel_tabs}>
          <button
            className={`${Style.tab} ${activeTab === "dashboard" ? Style.active : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 Dashboard
          </button>
          <button
            className={`${Style.tab} ${activeTab === "mint" ? Style.active : ""}`}
            onClick={() => setActiveTab("mint")}
          >
            🎨 Mint NFT
          </button>
          <button
            className={`${Style.tab} ${activeTab === "royalty" ? Style.active : ""}`}
            onClick={() => setActiveTab("royalty")}
          >
            💰 Royalty Settings
          </button>
          <button
            className={`${Style.tab} ${activeTab === "management" ? Style.active : ""}`}
            onClick={() => setActiveTab("management")}
          >
            ⚙️ Contract Management
          </button>
          <button
            className={`${Style.tab} ${activeTab === "list" ? Style.active : ""}`}
            onClick={() => setActiveTab("list")}
          >
            🏪 List NFTs
          </button>
        </div>

        {activeTab === "dashboard" && (
          <div className={Style.dashboardTab}>
            <h2>📈 Marketplace Statistics</h2>
            <div className={Style.statsGrid}>
              <div className={Style.statCard}>
                <div className={Style.statIcon}>🎯</div>
                <div className={Style.statContent}>
                  <h3>Total Minted</h3>
                  <span className={Style.statValue}>{contractStats.totalMinted}</span>
                  <span className={Style.statTrend}>NFTs Created</span>
                </div>
              </div>
              <div className={Style.statCard}>
                <div className={Style.statIcon}>💎</div>
                <div className={Style.statContent}>
                  <h3>Total Listed</h3>
                  <span className={Style.statValue}>{contractStats.totalListed}</span>
                  <span className={Style.statTrend}>Active Listings</span>
                </div>
              </div>
              <div className={Style.statCard}>
                <div className={Style.statIcon}>🏪</div>
                <div className={Style.statContent}>
                  <h3>Available</h3>
                  <span className={Style.statValue}>{contractStats.available}</span>
                  <span className={Style.statTrend}>Listed for Sale</span>
                </div>
              </div>
              <div className={Style.statCard}>
                <div className={Style.statIcon}>💸</div>
                <div className={Style.statContent}>
                  <h3>Royalty Rate</h3>
                  <span className={Style.statValue}>{currentRoyaltyInfo.feePercentage}%</span>
                  <span className={Style.statTrend}>Current Fee</span>
                </div>
              </div>
            </div>
            
            <div className={Style.quickActions}>
              <h3>⚡ Quick Actions</h3>
              <div className={Style.actionButtons}>
                <button 
                  className={Style.actionBtn}
                  onClick={() => setActiveTab("mint")}
                >
                  🎨 Mint New NFT
                </button>
                <button 
                  className={Style.actionBtn}
                  onClick={() => setActiveTab("royalty")}
                >
                  💰 Update Royalties
                </button>
                <button 
                  className={Style.actionBtn}
                  onClick={() => router.push("/searchPage")}
                >
                  🔍 View Marketplace
                </button>
                <button 
                  className={Style.actionBtn}
                  onClick={loadAdminData}
                >
                  🔄 Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "mint" && (
          <div className={Style.mintTab}>
            <h2>🎨 Mint New NFT</h2>
            <div className={Style.mintContent}>
              <div className={Style.mintLeft}>
                <div className={Style.imageUpload}>
                  <h3>📸 Upload NFT Image</h3>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={Style.fileInput}
                    disabled={loading || isSubmitting}
                  />
                  <div className={Style.uploadHint}>
                    Support: JPEG, PNG, GIF, WebP (Max 10MB)
                  </div>
                  {previewImage && (
                    <div className={Style.imagePreview}>
                      <img src={previewImage} alt="Preview" />
                      <button 
                        className={Style.removeBtn}
                        onClick={() => {
                          setPreviewImage(null);
                          setFileUrl(null);
                        }}
                      >
                        ❌
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={Style.mintRight}>
                <div className={Style.formGroup}>
                  <h3>📝 NFT Details</h3>
                  <input
                    type="text"
                    placeholder="NFT Name (min 3 characters)"
                    value={formInput.name}
                    onChange={(e) =>
                      setFormInput({ ...formInput, name: e.target.value })
                    }
                    disabled={loading || isSubmitting}
                    maxLength={100}
                  />
                  <textarea
                    placeholder="NFT Description (min 10 characters)"
                    value={formInput.description}
                    onChange={(e) =>
                      setFormInput({ ...formInput, description: e.target.value })
                    }
                    disabled={loading || isSubmitting}
                    maxLength={1000}
                  />

                  
                  <div className={Style.actionButtons}>
                    <Button 
                      btnName={isSubmitting ? "Minting..." : "🎯 Mint NFT"}
                      handleClick={mintNFT}
                      disabled={loading || isSubmitting}
                    />
                    <button 
                      className={Style.resetBtn}
                      onClick={resetForm}
                      disabled={loading || isSubmitting}
                    >
                      🔄 Reset Form
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "royalty" && (
          <div className={Style.royaltyTab}>
            <h2>💰 Royalty Settings</h2>
            
            <div className={Style.currentRoyalty}>
              <h3>📊 Current Settings</h3>
              <div className={Style.royaltyInfo}>
                <div className={Style.royaltyItem}>
                  <span className={Style.label}>Fee Rate:</span>
                  <span className={Style.value}>{currentRoyaltyInfo.fee} basis points ({currentRoyaltyInfo.feePercentage}%)</span>
                </div>
                <div className={Style.royaltyItem}>
                  <span className={Style.label}>Receiver:</span>
                  <span className={Style.value}>{currentRoyaltyInfo.receiver}</span>
                </div>
              </div>
            </div>

            <div className={Style.royaltyUpdate}>
              <h3>⚙️ Update Settings</h3>
              <div className={Style.formGroup}>
                <label>Royalty Fee (Basis Points)</label>
      <input
        type="number"
                  min="0"
                  max="1000"
                  placeholder="Enter fee (0-1000 basis points = 0-10%)"
                  value={royaltyFee}
                  onChange={(e) => setRoyaltyFee(e.target.value)}
                  disabled={loading || isSubmitting}
                />
                <div className={Style.hint}>
                  100 basis points = 1% | Max: 1000 (10%)
                </div>
              </div>
              
              <div className={Style.formGroup}>
                <label>Royalty Receiver Address</label>
      <input
        type="text"
        placeholder="0x..."
                  value={royaltyReceiver}
                  onChange={(e) => setRoyaltyReceiver(e.target.value)}
                  disabled={loading || isSubmitting}
                />
                <div className={Style.hint}>
                  Enter valid Ethereum address to receive royalties
                </div>
              </div>
              
              <Button 
                btnName={isSubmitting ? "Updating..." : "💰 Update Royalty Settings"}
                handleClick={updateRoyalty}
                disabled={loading || isSubmitting}
              />
            </div>
          </div>
        )}

        {activeTab === "management" && (
          <div className={Style.managementTab}>
            <h2>⚙️ Contract Management</h2>
            
            <div className={Style.managementGrid}>
              {/* Burn Address Management */}
              <div className={Style.managementCard}>
                <h3>🔥 Burn Address</h3>
                <p>Set the address where redeemed gold tokens are sent</p>
                <div className={Style.formGroup}>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={burnAddress}
                    onChange={(e) => setBurnAddressInput(e.target.value)}
                    disabled={loading || isSubmitting}
                  />
                  <Button 
                    btnName={isSubmitting ? "Updating..." : "Set Burn Address"}
                    handleClick={handleSetBurnAddress}
                    disabled={loading || isSubmitting}
                  />
                </div>
              </div>

              {/* Recovery Address Management */}
              <div className={Style.managementCard}>
                <h3>🛡️ Vault Recovery Address</h3>
                <p>Set the address for emergency token recovery</p>
                <div className={Style.formGroup}>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={recoveryAddress}
                    onChange={(e) => setRecoveryAddressInput(e.target.value)}
                    disabled={loading || isSubmitting}
                  />
                  <Button 
                    btnName={isSubmitting ? "Updating..." : "Set Recovery Address"}
                    handleClick={handleSetRecoveryAddress}
                    disabled={loading || isSubmitting}
                  />
                </div>
              </div>

              {/* Token Recovery */}
              <div className={Style.managementCard}>
                <h3>🔍 Token Recovery</h3>
                <p>Recover a gold token from any address (emergency use)</p>
                <div className={Style.formGroup}>
                  <input
                    type="text"
                    placeholder="From Address (0x...)"
                    value={recoveryFromAddress}
                    onChange={(e) => setRecoveryFromAddress(e.target.value)}
                    disabled={loading || isSubmitting}
                  />
                  <input
                    type="number"
                    placeholder="Token ID"
                    value={recoveryTokenId}
                    onChange={(e) => setRecoveryTokenId(e.target.value)}
                    disabled={loading || isSubmitting}
                  />
                  <Button 
                    btnName={isSubmitting ? "Recovering..." : "Recover Token"}
                    handleClick={handleRecoverToken}
                    disabled={loading || isSubmitting}
                  />
                </div>
              </div>

              {/* Metadata Update */}
              <div className={Style.managementCard}>
                <h3>📝 Update Token Metadata</h3>
                <p>Update the metadata for an existing gold token</p>
                <div className={Style.formGroup}>
                  <input
                    type="number"
                    placeholder="Token ID"
                    value={updateTokenId}
                    onChange={(e) => setUpdateTokenId(e.target.value)}
                    disabled={loading || isSubmitting}
                  />
                  <input
                    type="text"
                    placeholder="New Name"
                    value={updateFormInput.name}
                    onChange={(e) => setUpdateFormInput({ ...updateFormInput, name: e.target.value })}
                    disabled={loading || isSubmitting}
                  />
                  <textarea
                    placeholder="New Description"
                    value={updateFormInput.description}
                    onChange={(e) => setUpdateFormInput({ ...updateFormInput, description: e.target.value })}
                    disabled={loading || isSubmitting}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => setUpdatePreviewImage(e.target.result);
                        reader.readAsDataURL(file);
                        try {
                          const url = await uploadToPinata(file);
                          setUpdateFileUrl(url);
                        } catch (error) {
                          console.error("Error uploading image:", error);
                        }
                      }
                    }}
                    disabled={loading || isSubmitting}
                  />
                  {updatePreviewImage && (
                    <div className={Style.imagePreview}>
                      <img src={updatePreviewImage} alt="Preview" />
                    </div>
                  )}
                  <Button 
                    btnName={isSubmitting ? "Updating..." : "Update Metadata"}
                    handleClick={handleUpdateMetadata}
                    disabled={loading || isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "list" && (
          <div className={Style.listTab}>
            <h2>🏪 List NFTs for Sale</h2>
            
            <div className={Style.listContent}>
              <div className={Style.nftSelection}>
                <h3>📋 Select NFT to List</h3>
                {userNFTs.length > 0 ? (
                  <div className={Style.nftGrid}>
                    {userNFTs.map((nft) => (
                      <div 
                        key={nft.tokenId} 
                        className={`${Style.nftCard} ${listTokenId === nft.tokenId.toString() ? Style.selected : ""}`}
                        onClick={() => setListTokenId(nft.tokenId.toString())}
                      >
                        <div className={Style.nftCardImage}>
                          {nft.image ? (
                            <img src={nft.image} alt={nft.name} />
                          ) : (
                            <div className={Style.noImage}>No Image</div>
                          )}
                        </div>
                        <div className={Style.nftCardInfo}>
                          <h4>{nft.name || `NFT #${nft.tokenId}`}</h4>
                          <p>Token ID: {nft.tokenId}</p>
                          <p>Owner: {nft.owner}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={Style.noNFTs}>
                    <p>No NFTs found. Mint some NFTs first!</p>
                    <div className={Style.debugActions}>
                      <button 
                        className={Style.actionBtn}
                        onClick={() => setActiveTab("mint")}
                      >
                        🎨 Go to Mint
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {listTokenId && (
                <div className={Style.listingForm}>
                  <h3>💰 Set Listing Price</h3>
                  <div className={Style.formGroup}>
                    <label>Price (ETH)</label>
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      placeholder="Enter price in ETH"
                      value={listPrice}
                      onChange={(e) => setListPrice(e.target.value)}
                      disabled={loading || isSubmitting}
                    />
                    <div className={Style.hint}>
                      Minimum price: 0.001 ETH
                    </div>
                  </div>
                  
                  <div className={Style.listingPreview}>
                    <h4>📊 Listing Preview</h4>
                    <div className={Style.previewItem}>
                      <span>Selected NFT:</span>
                      <span>{userNFTs.find(nft => nft.tokenId.toString() === listTokenId)?.name || `NFT #${listTokenId}`}</span>
                    </div>
                    <div className={Style.previewItem}>
                      <span>Price:</span>
                      <span>{listPrice ? `${listPrice} ETH` : 'Not set'}</span>
                    </div>
                    <div className={Style.previewItem}>
                      <span>Platform:</span>
                      <span>Seaport Marketplace</span>
                    </div>
                  </div>
                  
                  <Button 
                    btnName={isSubmitting ? "Creating Listing..." : "🏪 Create Seaport Listing"}
                    handleClick={handleListNFT}
                    disabled={loading || isSubmitting || !listPrice}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {(loading || isSubmitting) && (
          <div className={Style.loadingOverlay}>
            <Loader />
          </div>
        )}
      </div>

      {openError && <Error />}
    </div>
  );
};

export default AdminPanel; 