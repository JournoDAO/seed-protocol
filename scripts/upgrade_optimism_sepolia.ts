import { ethers, upgrades } from 'hardhat';



async function main() {
  // Deploy SeedProtocol
  const SeedProtocol = await ethers.getContractFactory('SeedProtocol');
  const seedProtocol = await upgrades.upgradeProxy('0xA2b8315fd0F31c334be1B137D9E0FfbB3F200E57', SeedProtocol);

  if (!seedProtocol) {
    throw new Error('SeedProtocol not deployed');
  }

  await seedProtocol.waitForDeployment();

  console.log('SeedProtocol deployed to:', seedProtocol.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
