import { ethers }                            from 'hardhat'
import { testPublishRequestData }            from './test_data'
import { Contract }                          from 'ethers'
import PermaPressJson                     from '../../artifacts/contracts/PermaPress.sol/PermaPress.json'

async function main() {

  const [signer] = await ethers.getSigners();

  const seedProtocolContract = new Contract('0x99bba657f2bbc93c02d617f8ba121cb8fc104acf', PermaPressJson.abi, signer);

  const multiPublish = seedProtocolContract.getFunction('multiPublish');

    if (!multiPublish) {
      throw new Error('multiPublish function fragment not found');
    }

    // const transaction = await multiPublish.send(testPublishRequestData, {
    //   value: BigInt(0),
    //   // gasLimit: BigInt(1022881482n),
    //   gasLimit: 30000000n,
    // });

    const result = await seedProtocolContract.multiPublish(testPublishRequestData)

    const receipt = await result.wait()

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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
