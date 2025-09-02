// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

/**
 * @title GoldVault
 * @dev Base contract for managing vault addresses and recovery mechanisms
 */
contract GoldVault {
    address public vaultRecoveryAddress;
    address public goldBurnAddress = address(0);

    constructor(address _vaultRecoveryAddress) {
        vaultRecoveryAddress = _vaultRecoveryAddress;
    }

    function _setVaultRecoveryAddress(address newVaultRecoveryAddress) internal {
        vaultRecoveryAddress = newVaultRecoveryAddress;
    }

    function _setGoldBurnAddress(address newGoldBurnAddress) internal {
        goldBurnAddress = newGoldBurnAddress;
    }
}

/**
 * @title AntevortaGold
 * @dev ERC721 token representing physical gold coins with royalty support
 * @notice Each NFT represents a physical gold coin stored in Antevorta's vaults
 */
contract AntevortaGold is ERC721, ERC721URIStorage, AccessControl, Pausable, GoldVault, ERC2981 {
    using Counters for Counters.Counter;

    // Role definitions for gold management
    bytes32 public constant GOLD_MINTER_ROLE = keccak256("GOLD_MINTER_ROLE");
    bytes32 public constant VAULT_KEEPER_ROLE = keccak256("VAULT_KEEPER_ROLE");
    
    // Gold coin token counter
    Counters.Counter private _goldTokenIds;

    // Events for gold operations
    event GoldTokenMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event GoldMetadataUpdated(uint256 indexed tokenId, string newTokenURI);
    event GoldTokenRecovered(address indexed from, address indexed to, uint256 indexed tokenId);
    event RoyaltyInfoUpdated(address indexed recipient, uint96 feeNumerator);

    constructor() 
        ERC721("AntevortaGold", "GOLD") 
        GoldVault(msg.sender) 
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GOLD_MINTER_ROLE, msg.sender);
        _grantRole(VAULT_KEEPER_ROLE, msg.sender);
        
        // Set default royalty to 2.5% (250 basis points)
        _setDefaultRoyalty(msg.sender, 250);
    }

    /**
     * @dev Mints a new gold token
     * @param to Address to mint the token to
     * @param goldTokenURI Metadata URI for the gold coin
     */
    function mintGoldToken(address to, string memory goldTokenURI) 
        public 
        onlyRole(GOLD_MINTER_ROLE) 
    {
        uint256 tokenId = _goldTokenIds.current();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, goldTokenURI);
        _goldTokenIds.increment();
        
        emit GoldTokenMinted(to, tokenId, goldTokenURI);
    }

    /**
     * @dev Returns the total supply of gold tokens
     */
    function totalGoldSupply() public view returns (uint256) {
        return _goldTokenIds.current();
    }

    /**
     * @dev Updates the metadata URI for a gold token
     * @param goldTokenId The token ID to update
     * @param goldTokenURI New metadata URI
     */
    function updateGoldMetadata(uint256 goldTokenId, string memory goldTokenURI) 
        public 
        onlyRole(GOLD_MINTER_ROLE) 
    {
        require(_ownerOf(goldTokenId) != address(0), "AntevortaGold: Gold token does not exist");
        _setTokenURI(goldTokenId, goldTokenURI);
        
        emit GoldMetadataUpdated(goldTokenId, goldTokenURI);
    }

    /**
     * @dev Sets the royalty information for all gold tokens
     * @param royaltyRecipient Address to receive royalties
     * @param royaltyFeeBps Royalty fee in basis points (e.g., 250 = 2.5%)
     */
    function setGoldRoyaltyInfo(address royaltyRecipient, uint96 royaltyFeeBps) 
        public 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(royaltyRecipient != address(0), "AntevortaGold: Invalid royalty recipient");
        require(royaltyFeeBps <= 10000, "AntevortaGold: Royalty fee exceeds maximum");
        
        _setDefaultRoyalty(royaltyRecipient, royaltyFeeBps);
        
        emit RoyaltyInfoUpdated(royaltyRecipient, royaltyFeeBps);
    }

    /**
     * @dev Pauses all gold token transfers
     */
    function pauseGoldTransfers() public onlyRole(VAULT_KEEPER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses gold token transfers
     */
    function unpauseGoldTransfers() public onlyRole(VAULT_KEEPER_ROLE) {
        _unpause();
    }

    /**
     * @dev Hook that is called before any token transfer
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Burns a gold token by sending it to the burn address
     * @param goldTokenId The token to burn
     */
    function redeemGoldToken(uint256 goldTokenId) public virtual {
        require(
            _isApprovedOrOwner(_msgSender(), goldTokenId), 
            "AntevortaGold: Caller is not owner nor approved"
        );
        require(goldBurnAddress != address(0), "AntevortaGold: Burn address not set");
        
        safeTransferFrom(_msgSender(), goldBurnAddress, goldTokenId);
    }

    /**
     * @dev Internal burn function override
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /**
     * @dev Sets the address where redeemed gold tokens are sent
     * @param newGoldBurnAddress The new burn address
     */
    function setGoldBurnAddress(address newGoldBurnAddress) 
        public 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        _setGoldBurnAddress(newGoldBurnAddress);
    }

    /**
     * @dev Recovers a gold token from any address (emergency recovery)
     * @param from Address to recover the token from
     * @param goldTokenId The token to recover
     */
    function recoverGoldToken(address from, uint256 goldTokenId) 
        public 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_ownerOf(goldTokenId) != address(0), "AntevortaGold: Gold token does not exist");
        _transfer(from, vaultRecoveryAddress, goldTokenId);
        
        emit GoldTokenRecovered(from, vaultRecoveryAddress, goldTokenId);
    }

    /**
     * @dev Sets the vault recovery address
     * @param newVaultRecoveryAddress The new recovery address
     */
    function setVaultRecoveryAddress(address newVaultRecoveryAddress) 
        public 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(
            newVaultRecoveryAddress != address(0), 
            "AntevortaGold: Recovery address cannot be zero address"
        );
        _setVaultRecoveryAddress(newVaultRecoveryAddress);
    }

    /**
     * @dev Returns the token URI for a gold token
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Check if contract supports an interface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}