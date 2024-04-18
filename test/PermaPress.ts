import {expect}                                        from 'chai'
import {ethers,}                                                from 'hardhat'
import {
  MultiAttestationRequest, SchemaEncoder, ZERO_ADDRESS, ZERO_BYTES32,
} from '@ethereum-attestation-service/eas-sdk'
import { deployToLocalHardhat, ValuesStore } from '../scripts/utils/deploy'
import { PublishRequestDataStruct }                               from '../typechain-types/contracts/PermaPress'
import { defaultAttestationRequestData, generateId, modelSchema } from '../scripts/utils'
import { SeedToCreate }                                           from '../scripts/types'
import { testPublishRequestData } from '../scripts/utils/test_data'



describe('PermaPress', () => {
  let valuesStore: ValuesStore = {}

  before(async () => {

    valuesStore = await deployToLocalHardhat()

  });

  it('should create an Identity seed using the Identity Schema UID, and return the UID of the new seed', async function () {
    expect(ethers.isHexString(
      valuesStore.identitySeedUid
    )).to.be.true;
  });

  it('should create a post seed and return the UID', async function () {
    expect(ethers.isHexString(
      valuesStore.postSeedUid
    )).to.be.true;
  });

  // it('should deploy all schemas for Identity properties', async function () {
  //   expect(ethers.isHexString(
  //     valuesStore.displayNameSchemaUid
  //   )).to.be.true;
  //   expect(ethers.isHexString(
  //     valuesStore.profileSchemaUid
  //   )).to.be.true;
  //   expect(ethers.isHexString(
  //     valuesStore.uriSchemaUid
  //   )).to.be.true;
  //   expect(ethers.isHexString(
  //     valuesStore.labelSchemaUid
  //   )).to.be.true;
  //   expect(ethers.isHexString(
  //     valuesStore.linkSchemaUid
  //   )).to.be.true;
  // });

  // it('should create a version for the identity seed and return the UID of the new version', async function () {
  //
  //   const {
  //     permaPress,
  //     eas,
  //     versionSchemaUid,
  //     identitySeedUid,
  //     modelUids,
  //   } = valuesStore
  //
  //   if (!eas) {
  //     throw new Error('EAS contract not found');
  //   }
  //
  //   if (!permaPress) {
  //     throw new Error('PermaPress contract not found');
  //   }
  //
  //   if (!modelUids) {
  //     throw new Error('PropertyData not found');
  //   }
  //
  //   const createVersion = permaPress.getFunction('createVersion');
  //
  //   if (!createVersion) {
  //     throw new Error('Function fragment not found');
  //   }
  //
  //   console.log('calling createVersion with identitySeedUid', identitySeedUid, 'versionSchemaUid', versionSchemaUid)
  //
  //   const transaction = await createVersion.send(identitySeedUid, versionSchemaUid, {
  //     value: BigInt(0),
  //     // gasLimit: BigInt(1022881482n),
  //     gasLimit: 30000000n,
  //   });
  //
  //   console.log('transaction', transaction)
  //
  //   const receipt = await transaction.wait();
  //
  //   console.log('receipt', receipt)
  //
  //   if (!receipt) {
  //     throw new Error('Transaction failed');
  //   }
  //
  //   if (!receipt.logs || receipt.logs.length === 0) {
  //     throw new Error('No logs found');
  //   }
  //
  //   const returnedUids: string[] = []
  //
  //   for ( let i = 0; i < receipt.logs.length; i++ ) {
  //     const log = receipt.logs[i]
  //     if (log.args) {
  //       const arg = log.args[0]
  //       if (arg && arg.length === 64) {
  //         returnedUids.push(`0x${arg}`)
  //       }
  //     }
  //   }
  //
  //   console.log(returnedUids)
  //
  //   for ( let j = 0; j < returnedUids.length; j++ ) {
  //     const uid = returnedUids[j]
  //     expect(ethers.isHexString(uid)).to.be.true;
  //
  //     const attestation = await eas.getAttestation(uid)
  //     expect(attestation).to.not.be.null
  //   }
  //
  //
  // });

  it('should use multiPublish to publish all attestations needed for a seed', async function () {
    const {
      permaPress,
      eas,
    } = valuesStore

    if (!permaPress) {
      throw new Error('PermaPress contract not found');
    }

    const multiPublish = permaPress.getFunction('multiPublish');

    if (!multiPublish) {
      throw new Error('multiPublish function fragment not found');
    }

    const transaction = await multiPublish.send(testPublishRequestData, {
      value: BigInt(0),
      // gasLimit: BigInt(1022881482n),
      gasLimit: 30000000n,
    });

    const result = await permaPress.multiPublish(testPublishRequestData)

    const done = await result.wait()

    // console.log('===== done =====')
    // console.log(done)
    // console.log('===== /done =====')

    const receipt = await transaction.wait();

    // permaPress.interface.forEachEvent((event, index) => {
    //   // console.log(event)
    //   console.log(`index: ${index}`)
    //   console.log(permaPress.interface.decodeEventLog(event, logs[0].data, logs[0].topics))
    // })

    // Log the messages
    // logs.forEach(log => {
    //     console.log(log.toJSON());
    //     console.log(permaPress.interface.decodeEventLog('Log', log.data, log.topics))
    // });


    if (!receipt) {
      throw new Error('Transaction failed');
    }

    if (!receipt.logs || receipt.logs.length === 0) {
      throw new Error('No logs found');
    }

    const returnedUids: string[] = []

    for ( let i = 0; i < receipt.logs.length; i++ ) {
      const log = receipt.logs[i]
      if (log.args) {
        const arg = log.args[0]
        console.log(arg)
        if (arg && arg.length === 64) {
          returnedUids.push(`0x${arg}`)
        }
      }
    }

    console.log(returnedUids)

    for ( let j = 0; j < returnedUids.length; j++ ) {
      const uid = returnedUids[j]
      expect(ethers.isHexString(uid)).to.be.true;

      const attestation = await eas!.getAttestation(uid)
      expect(attestation).to.not.be.null
    }

    // console.log(receipt.toJSON())
  })
})

//   it('should publish a seed, a version, and property attestations', async function () {
//     const {
//       permaPress,
//       postSchemaUid,
//       versionSchemaUid,
//       modelUids,
//     } = valuesStore
//
//     if (!permaPress) {
//       throw new Error('PermaPress contract not found');
//     }
//
//     const publish = permaPress.getFunction('publish');
//
//     if (!publish) {
//       throw new Error('publish function fragment not found');
//     }
//
//     const testData = {
//       model: 'Post',
//       properties: {
//         title: 'Hello, World!',
//         summary: 'This is a test post',
//         featureImageId: generateId(),
//         authorIdentityIds: [generateId(), generateId()],
//       }
//     }
//
//     const requestData: MultiAttestationRequest[] = []
//     const seedsToCreate: SeedToCreate[] = []
//
//     const model = testData.model
//     const modelInfo = modelUids![model]
//
//     for (const key of Object.keys(testData.properties)) {
//       const modelProperty = modelInfo.properties![key]
//       if (!modelProperty) {
//         throw new Error(`Property not found: ${key}`);
//       }
//       console.log(`${key}:  ${testData.properties[key]}`)
//       const value = testData.properties[key]
//       const snakeCaseKey = key.replace(/([A-Z])/g, (g) => `_${g[0].toLowerCase()}`);
//       if (modelProperty.ref && !modelProperty.list) {
//
//         const refSchemaUid = modelUids![modelProperty.ref].schemaUid
//
//         seedsToCreate.push({
//           schemaUid: refSchemaUid,
//           revocable: true,
//           propertySchemaUid: modelProperty.schemaUid,
//           createdSeedUid: ZERO_BYTES32
//         })
//
//         const data = [
//           {name: snakeCaseKey, type: modelProperty.dataType, value: ZERO_BYTES32,}
//         ]
//
//         const dataEncoder = new SchemaEncoder(modelProperty.schemaDefinition)
//         const encodedData = dataEncoder.encodeData(data)
//
//         requestData.push({
//           schema: modelProperty.schemaUid,
//           data: [
//             {
//               ...defaultAttestationRequestData,
//               data: encodedData,
//             }
//           ]
//         })
//         continue
//       }
//
//       if (modelProperty.ref && modelProperty.list) {
//         const refSchemaUid = modelUids![modelProperty.ref].schemaUid
//         for (const refId of value) {
//           if ( refId.length === 10 ) {
//             seedsToCreate.push({
//               schemaUid: refSchemaUid,
//               revocable: true,
//               propertySchemaUid: modelProperty.schemaUid,
//               createdSeedUid: ZERO_BYTES32
//             })
//
//           }
//         }
//         const valueArray = value.map((refId: string) => {
//           return ZERO_BYTES32
//         })
//
//
//         const data = [
//           {name: snakeCaseKey, type: modelProperty.dataType, value: valueArray,}
//         ]
//
//         const dataEncoder = new SchemaEncoder(modelProperty.schemaDefinition)
//         const encodedData = dataEncoder.encodeData(data)
//
//         requestData.push({
//           schema: modelProperty.schemaUid,
//           data: [
//             {
//               ...defaultAttestationRequestData,
//               data: encodedData,
//             }
//           ]
//         })
//
//         requestData.push({
//           schema: modelProperty.schemaUid,
//           data: [
//             {
//               ...defaultAttestationRequestData,
//               data: encodedData,
//             }
//           ]
//         })
//         continue
//       }
//
//       const data = [
//         {name: snakeCaseKey, type: modelProperty.dataType, value,}
//       ]
//
//       const dataEncoder = new SchemaEncoder(modelProperty.schemaDefinition)
//       const encodedData = dataEncoder.encodeData(data)
//
//       const existingItem = requestData.find((item) => item.schema === modelProperty.schemaUid)
//       if (existingItem) {
//         existingItem.data.push({
//           ...defaultAttestationRequestData,
//           data: encodedData,
//         })
//       }
//       if (!existingItem) {
//         requestData.push({
//           schema: modelProperty.schemaUid,
//           data: [
//             {
//               ...defaultAttestationRequestData,
//               data: encodedData,
//             }
//           ]
//         })
//       }
//     }
//
//
//     const publishRequest = {
//       seedUid: ZERO_BYTES32,
//       seedSchemaUid: postSchemaUid,
//       versionUid: ZERO_BYTES32,
//       versionSchemaUid,
//       seedIsRevocable: true,
//       seedsToCreate,
//       listOfAttestations: requestData,
//     } as PublishRequestDataStruct
//
//     console.log(publishRequest)
//
//     const transaction = await publish.send(publishRequest, {
//       value: BigInt(0),
//       // gasLimit: BigInt(1022881482n),
//       gasLimit: 30000000n,
//     });
//
//     const result = await permaPress.publish(publishRequest)
//
//     const done = await result.wait()
//
//     console.log('===== done =====')
//     console.log(done)
//     console.log('===== /done =====')
//
//     const receipt = await transaction.wait();
//
//      // Get the emitted events
//     // const logs = await permaPress.queryFilter('PublishResultData');
//
//     // console.log(receipt.logs)
//
//     // permaPress.interface.forEachEvent((event, index) => {
//     //   // console.log(event)
//     //   console.log(`index: ${index}`)
//     //   console.log(permaPress.interface.decodeEventLog(event, logs[0].data, logs[0].topics))
//     // })
//
//     // Log the messages
//     // logs.forEach(log => {
//     //     console.log(log.toJSON());
//     //     console.log(permaPress.interface.decodeEventLog('Log', log.data, log.topics))
//     // });
//
//
//     for (const log of receipt.logs) {
//       // console.log('log.index', log.index)
//       // console.log('log.topics', log.topics)
//       if (log.args) {
//         console.log(log.toJSON())
//         // const finalResult = JSON.parse(log.args[0])
//         // console.log(JSON.stringify(log.args))
//         // console.log(finalResult)
//         console.log(permaPress.interface.parseLog(log))
//       }
//     }
//
//     if (!receipt) {
//       throw new Error('Transaction failed');
//     }
//
//     if (!receipt.logs || receipt.logs.length === 0) {
//       throw new Error('No logs found');
//     }
//
//     // console.log(receipt.toJSON())
//   })
// })


