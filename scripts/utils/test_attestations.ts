import { ethers }                            from 'hardhat'
import { testPublishRequestData }            from './test_data'
import { Contract }                          from 'ethers'
import SeedProtocolJson                     from '../../artifacts/contracts/SeedProtocol.sol/SeedProtocol.json'

async function main() {

  const [signer] = await ethers.getSigners();

  const seedProtocolContract = new Contract('0xA2b8315fd0F31c334be1B137D9E0FfbB3F200E57', SeedProtocolJson.abi, signer.provider);

  const multiPublish = seedProtocolContract.getFunction('multiPublish');

  if (!multiPublish) {
    throw new Error('multiPublish function fragment not found');
  }

  const estimatedGas = await multiPublish.estimateGas(testPublishRequestData)
  console.log('estimatedGas', estimatedGas.toString())

  try {
    const transaction = await multiPublish.send(testPublishRequestData, {
      value: BigInt(0),
      // gasLimit: BigInt(1022881482n),
      gasLimit: 30000000n,
    });

    const receipt = await transaction.wait();

    if (!receipt) {
      console.error('Transaction failed');
      return
    }

    // const result = await seedProtocolContract.multiPublish(testPublishRequestData)
    //
    // const receipt = await result.wait()

    // console.log('===== done =====')
    // console.log(receipt)
    // console.log('===== /done =====')

    console.log('receipt.logs.length', receipt.logs.length)

    for (const log of receipt.logs) {
      // console.log('log.index', log.index)
      // console.log('log.topics', log.topics)
      if (log.args) {
        // console.log(log.toJSON())
        // const finalResult = JSON.parse(log.args[0])
        // console.log(JSON.stringify(log.args))
        // console.log(finalResult)
        console.log(seedProtocolContract.interface.parseLog(log))
      }
    }

  } catch (error) {
    console.error(error)

  }

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
