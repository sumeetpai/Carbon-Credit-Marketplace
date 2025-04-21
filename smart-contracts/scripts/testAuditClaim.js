const { ethers } = require("hardhat");

async function main() {
  const marketplaceAddress = "0x27acCBFb478d940DbAB1392c29897054782270D9";
  const auditorAddress = "0xc8d3750bC9B300fEA4adD56c5285EA459089CE29";
  const projectId = 1;
  const uri = "ipfs://your-uri.json";

  const signer = await ethers.getSigner(auditorAddress);
  console.log("Auditor:", signer.address);

  const marketplace = await ethers.getContractAt("CarbonMarketplace", marketplaceAddress, signer);
  console.log("Connected to CarbonMarketplace at", marketplaceAddress);

  const project = await marketplace.projects(projectId);
  console.log("Project:", {
    owner: project.owner,
    amount: project.amount.toString(),
    audited: project.audited,
    nftId: project.nftId.toString(),
  });

  if (project.owner === ethers.constants.AddressZero) {
    console.log("❌ Project does not exist");
    return;
  }

  if (project.audited) {
    console.log("⚠️ Project already audited");
    return;
  }

  const tx = await marketplace.auditClaim(projectId, uri);
  console.log("📤 Transaction sent:", tx.hash);
  const receipt = await tx.wait();
  console.log("✅ Audit successful! Tx hash:", receipt.transactionHash);
}

main().catch((error) => {
  console.error("Script error:", error);
  process.exitCode = 1;
});
