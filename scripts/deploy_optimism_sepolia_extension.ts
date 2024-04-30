import { ethers, upgrades } from 'hardhat';



async function main() {
  // Deploy SeedProtocol
  const SeedProtocol = await ethers.getContractFactory('SeedProtocol');
  const seedProtocol = await upgrades.deployProxy(SeedProtocol, [
    '0x4200000000000000000000000000000000000021',
 ], { initializer: 'initialize' });

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
