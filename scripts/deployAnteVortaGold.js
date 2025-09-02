const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment of AnteVortaGold contract...");
  
  // Get the contract factory
  const AnteVortaGold = await hre.ethers.getContractFactory("AntevortaGold");
  
  console.log("📝 Deploying AnteVortaGold contract...");
  
  // Deploy the contract
  const antevortaGold = await AnteVortaGold.deploy();
  
  // Wait for deployment to complete
  await antevortaGold.deployed();
  
  console.log("✅ AnteVortaGold deployed successfully!");
  console.log(`📍 Contract Address: ${antevortaGold.address}`);
  console.log(`🔗 Network: Base Sepolia (Chain ID: 84532)`);
  console.log(`🌐 Block Explorer: https://sepolia.basescan.org/address/${antevortaGold.address}`);
  
  // Verify deployment by calling some view functions
  try {
    const name = await antevortaGold.name();
    const symbol = await antevortaGold.symbol();
    const totalSupply = await antevortaGold.totalGoldSupply();
    const owner = await antevortaGold.owner();
    
    console.log("\n📊 Contract Information:");
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Total Supply: ${totalSupply}`);
    console.log(`   Owner: ${owner}`);
    
    // Get royalty info
    const [royaltyRecipient, royaltyAmount] = await antevortaGold.royaltyInfo(0, ethers.utils.parseEther("1"));
    const royaltyPercentage = royaltyAmount.mul(10000).div(ethers.utils.parseEther("1"));
    console.log(`   Default Royalty: ${royaltyPercentage.toNumber() / 100}%`);
    console.log(`   Royalty Recipient: ${royaltyRecipient}`);
    
  } catch (error) {
    console.log("⚠️  Could not fetch contract info:", error.message);
  }
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Update your .env file with NEXT_PUBLIC_CONTRACT_ADDRESS");
  console.log("3. Restart your frontend application");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
