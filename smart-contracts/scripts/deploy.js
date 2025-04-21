const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy CarbonCreditToken
  const CCT = await hre.ethers.getContractFactory("CarbonCreditToken");
  const cct = await CCT.deploy(deployer.address);
  await cct.waitForDeployment();
  console.log("CarbonCreditToken deployed to:", await cct.getAddress());

  // Deploy GreenNFT
  const GreenNFT = await hre.ethers.getContractFactory("GreenNFT");
  const greenNFT = await GreenNFT.deploy(deployer.address);
  await greenNFT.waitForDeployment();
  console.log("GreenNFT deployed to:", await greenNFT.getAddress());

  // Deploy CarbonMarketplace with constructor arguments
  const Marketplace = await hre.ethers.getContractFactory("CarbonMarketplace");
  const marketplace = await Marketplace.deploy(
    deployer.address,
    await greenNFT.getAddress(),
    await cct.getAddress()
  );
  await marketplace.waitForDeployment();
  console.log("CarbonMarketplace deployed to:", await marketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
