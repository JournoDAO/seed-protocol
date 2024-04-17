import { ethers, upgrades }                      from 'hardhat'
import { EAS__factory, SchemaRegistry__factory } from '../../typechain-types'
import {
  EAS,
  SchemaEncoder,
  SchemaItem,
  SchemaRegistry,
  ZERO_ADDRESS,
  ZERO_BYTES32
} from '@ethereum-attestation-service/eas-sdk'
import { Contract }                                                     from 'ethers'
import {
  IdentitySchemaUids,
  ModelInfo,
  ModelProperty,
  ModelUids,
  NameSchema,
  ProcessModelSchema,
  PropertyInfo
} from '../types'
import {
  postSchemaDefEncoded,
  postSchemaDefinition,
  createSeed,
  displayNameSchemaDefEncoded,
  getUid,
  identitySchemaDefEncoded,
  identitySchemaDefinition,
  labelSchemaDefEncoded,
  linkSchemaDefEncoded,
  modelSchema,
  nameASchemaDefEncoded,
  nameASchemaDefinition,
  profileSchemaDefEncoded,
  SchemaTypes,
  uriSchemaDefEncoded,
  versionSchemaDefEncoded,
  versionSchemaDefinition,
  titleSchemaDefEncoded,
  summarySchemaDefEncoded,
  byte32Props,
  stringProps
} from './index'


const assembleSchemaString = (info: PropertyInfo): string => {
    return `${info.type} ${info.name}`
}

const nameSchema: NameSchema = async ({
    eas,
    schemaUid,
    schemaName,
    nameASchemaUid
}) => {

  const nameASchemaEncoder = new SchemaEncoder(nameASchemaDefinition)

  const formattedSchemaName = schemaName
    // To snake_case
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();

  const nameSchemaData: SchemaItem[] = [
    {name: 'schemaId', value: schemaUid, type: 'bytes32'},
    {name: 'name', value: formattedSchemaName, type: 'string'}
  ]

  const tx = await eas.attest({
    schema: nameASchemaUid,
    data: {
      recipient: ZERO_ADDRESS,
      data: nameASchemaEncoder.encodeData(nameSchemaData),
      revocable: true,
      refUID: ZERO_BYTES32,
      expirationTime: BigInt(0)
    }
  })

  await tx.wait()
}

const processModelSchema: ProcessModelSchema = async ({
    modelSchema,
    schemaRegistry,
    nameASchemaUid,
    eas,
}): Promise<ModelUids> => {

  const modelUids: ModelUids = {};

  for (const modelName in modelSchema) {
    console.log(modelName)
    const model = modelSchema[modelName];
    modelUids[modelName] = {
      properties: {},
    } as ModelInfo;

    modelUids[modelName].schemaDefinition = assembleSchemaString(model.info);
    modelUids[modelName].schemaUid = await getUid(schemaRegistry, modelUids[modelName].schemaDefinition);
    await nameSchema({
      eas,
      schemaUid: modelUids[modelName].schemaUid,
      schemaName: modelName,
      nameASchemaUid,
    })

    for (const propName in model.properties) {
      const schemaDefinition = assembleSchemaString(model.properties[propName]);
      const schemaUid = await getUid(schemaRegistry, schemaDefinition);
      await nameSchema({
        eas,
        schemaUid,
        schemaName: propName,
        nameASchemaUid,
      })
      const propertyInfo = model.properties[propName]
      const propertyData: ModelProperty = {
          schemaUid,
          schemaDefinition,
          dataType: propertyInfo.type,
      }
      if (propertyInfo.ref) {
        propertyData.ref = propertyInfo.ref
      }
      if (propertyInfo.list) {
        propertyData.list = propertyInfo.list
      }

      modelUids[modelName].properties[propName] = propertyData;

    }
  }

  return modelUids;
}

export type PropertyData = {
  schemaUid: string
  schemaDefinition: string
  dataType: string
}

export type ValuesStore = {
  permaPress?: Contract
  schemaRegistry?: SchemaRegistry
  schemaRegistryAddress?: string
  easAddress?: string
  eas?: EAS
  identitySchemaUid?: string
  postSchemaUid?: string
  versionSchemaUid?: string
  nameASchemaUid?: string
  postSeedUid?: string
  identitySeedUid?: string
  displayNameSchemaUid?: string
  profileSchemaUid?: string
  uriSchemaUid?: string
  labelSchemaUid?: string
  linkSchemaUid?: string
  identityUids?: IdentitySchemaUids
  modelUids?: ModelUids | null
}

export const deployToLocalHardhat = async (): Promise<ValuesStore> => {
  // Deploy SchemaRegistry
  console.log('Deploying SchemaRegistry')
  const schemaRegistryContract = await ethers.getContractFactory('SchemaRegistry') as SchemaRegistry__factory;
  const schemaRegistryDeployed = await schemaRegistryContract.deploy();

  await schemaRegistryContract.getDeployTransaction()

  const schemaRegistryAddress = await schemaRegistryDeployed.getAddress();
  console.log('SchemaRegistry deployed to:', schemaRegistryAddress);

  const schemaRegistry = new SchemaRegistry(schemaRegistryAddress);

  // Deploy EAS
  console.log('Deploying EAS')
  const easContract = await ethers.getContractFactory('EAS') as EAS__factory;
  const easContractDeployed = await easContract.deploy(schemaRegistryAddress);

  const easAddress = await easContractDeployed.getAddress();
  console.log('EAS deployed to:', easAddress);

  const eas = new EAS(easAddress);

  const [signer] = await ethers.getSigners();

  schemaRegistry.connect(signer);
  eas.connect(signer);
  console.log('Connected to SchemaRegistry and EAS');

  // Create NameASchema schema
  const nameASchemaUid = await getUid(schemaRegistry, nameASchemaDefEncoded)
  console.log('NameASchema UID:', nameASchemaUid);

  const modelUids = await processModelSchema({
    modelSchema,
    schemaRegistry,
    nameASchemaUid,
    eas,
  });
    console.log(modelUids.Post.properties.featureImageId)

  // Create Identity schema
  const identitySchemaUid = await getUid(schemaRegistry, identitySchemaDefEncoded)

  // Create Content schema
  const postSchemaUid = await getUid(schemaRegistry, postSchemaDefEncoded)

  // Create Version schema
  const versionSchemaUid = await getUid(schemaRegistry, versionSchemaDefEncoded)

  console.log(`nameASchemaUid: ${nameASchemaUid}`)
  console.log(`identitySchemaUid: ${identitySchemaUid}`)
  console.log(`postSchemaUid: ${postSchemaUid}`)
  console.log(`versionSchemaUid: ${versionSchemaUid}`)

  // Deploy PermaPress
  const PermaPress = await ethers.getContractFactory('PermaPress');
  const permaPress = await upgrades.deployProxy(PermaPress, [
    easContractDeployed.target,
 ], { initializer: 'initialize' });

  if (!permaPress) {
    throw new Error('PermaPress not deployed');
  }

  await permaPress.waitForDeployment();

  console.log('PermaPress deployed to:', permaPress.target);
  const identitySeedUid = await createSeed(permaPress, identitySchemaUid, 'bytes32')
  const postSeedUid = await createSeed(permaPress, postSchemaUid, 'bytes32')

  console.log(`identityAttestationUid: ${identitySeedUid}`)
  console.log(`postSeedUid: ${postSeedUid}`)

  // Populate modelSchema with schema UIDs
  for (const modelName in modelSchema) {
    const model = modelSchema[modelName];
    model.info.schemaUid = modelUids[modelName].schemaUid;

    for (const propName in model.properties) {
      const propertyInfo = model.properties[propName];
      propertyInfo.schemaUid = modelUids[modelName].properties[propName].schemaUid;
    }
  }

  // for (const propName in byte32Props) {
  //   const schemaDefinition = `bytes32 ${propName}`
  //   const schemaDefinitionEncoded = ethers.encodeBytes32String(schemaDefinition)
  //   const schemaUid = await getUid(schemaRegistry, schemaDefinitionEncoded)
  //   propertyData[propName] = {
  //     schemaUid,
  //     schemaDefinition,
  //     dataType: 'bytes32',
  //   }
  // }
  //
  // for (const propName in stringProps) {
  //   const schemaDefinition = `string ${propName}`
  //   const schemaDefinitionEncoded = ethers.encodeBytes32String(schemaDefinition)
  //   const schemaUid = await getUid(schemaRegistry, schemaDefinitionEncoded)
  //   propertyData[propName] = {
  //     schemaUid,
  //     schemaDefinition,
  //     dataType: 'string',
  //   }
  // }



  return {
    schemaRegistry,
    schemaRegistryAddress,
    easAddress,
    eas,
    nameASchemaUid,
    identitySchemaUid,
    postSchemaUid,
    versionSchemaUid,
    permaPress,
    identitySeedUid,
    postSeedUid,
    modelUids,
  }
}

export const deployToLocalHardhatOld = async (valuesStore: ValuesStore): Promise<ValuesStore> => {

  let {
    schemaRegistry,
    schemaRegistryAddress,
    easAddress,
    eas,
    identitySchemaUid,
    versionSchemaUid,
    nameASchemaUid,
    identitySeedUid,
    displayNameSchemaUid,
    profileSchemaUid,
    uriSchemaUid,
    labelSchemaUid,
    linkSchemaUid,
    identityUids,
    modelUids,
    permaPress,
  } = valuesStore

  identityUids = {
    display_name: null,
    profile: null,
    avatar_image_uri: null,
    links: null,
    label: null,
    uri: null,
  }

  // Deploy SchemaRegistry
  const schemaRegistryContract = await ethers.getContractFactory('SchemaRegistry') as SchemaRegistry__factory;
  const schemaRegistryDeployed = await schemaRegistryContract.deploy();

  await schemaRegistryContract.getDeployTransaction()

  schemaRegistryAddress = await schemaRegistryDeployed.getAddress();

  schemaRegistry = new SchemaRegistry(schemaRegistryAddress);

  // Deploy EAS
  const easContract = await ethers.getContractFactory('EAS') as EAS__factory;
  const easContractDeployed = await easContract.deploy(schemaRegistryAddress);

  easAddress = await easContractDeployed.getAddress();

  eas = new EAS(easAddress);

  const [signer] = await ethers.getSigners();

  schemaRegistry.connect(signer);
  eas.connect(signer);

  // Create NameASchema schema
  nameASchemaUid = await getUid(schemaRegistry, nameASchemaDefEncoded)

  modelUids = await processModelSchema({
    modelSchema,
    schemaRegistry,
    nameASchemaUid,
    eas,
  });
  console.log(modelUids)

  // Create Identity schema
  identitySchemaUid = await getUid(schemaRegistry, identitySchemaDefEncoded)

  // Create Content schema
  // contentSchemaUid = await getUid(schemaRegistry, postSchemaDefEncoded)

  // Create Version schema
  versionSchemaUid = await getUid(schemaRegistry, versionSchemaDefEncoded)

  console.log(`nameASchemaUid: ${nameASchemaUid}`)
  console.log(`identitySchemaUid: ${identitySchemaUid}`)
  // console.log(`contentSchemaUid: ${contentSchemaUid}`)
  console.log(`versionSchemaUid: ${versionSchemaUid}`)

  // Deploy PermaPress
  const PermaPress = await ethers.getContractFactory('PermaPress');
  permaPress = await upgrades.deployProxy(PermaPress, [
    versionSchemaUid,
    identitySchemaUid,
    // contentSchemaUid,
    versionSchemaDefinition,
    identitySchemaDefinition,
    postSchemaDefinition,
    schemaRegistryDeployed.target,
    easContractDeployed.target,
 ], { initializer: 'initialize' });

  if (!permaPress) {
    throw new Error('PermaPress not deployed');
  }

  await permaPress.waitForDeployment();

  console.log('PermaPress deployed to:', permaPress.target);
   identitySeedUid      = await createSeed(permaPress, identitySchemaUid, 'bytes32')
  // contentAttestationUid = await createSeed(permaPress, SchemaTypes.Content , 'uint8')

  console.log(`identityAttestationUid: ${identitySeedUid}`)
  // console.log(`contentAttestationUid: ${contentAttestationUid}`)

  displayNameSchemaUid = await getUid(schemaRegistry, displayNameSchemaDefEncoded)
  profileSchemaUid = await getUid(schemaRegistry, profileSchemaDefEncoded)
  uriSchemaUid = await getUid(schemaRegistry, uriSchemaDefEncoded)
  labelSchemaUid = await getUid(schemaRegistry, labelSchemaDefEncoded)
  linkSchemaUid = await getUid(schemaRegistry, linkSchemaDefEncoded)

  identityUids.display_name = displayNameSchemaUid
  identityUids.profile = profileSchemaUid
  identityUids.avatar_image_uri = uriSchemaUid
  identityUids.link = linkSchemaUid
  identityUids.label = labelSchemaUid
  identityUids.uri = uriSchemaUid

  return {
    permaPress,
    schemaRegistry,
    schemaRegistryAddress,
    easAddress,
    eas,
    identitySchemaUid,
    // contentSchemaUid,
    versionSchemaUid,
    nameASchemaUid,
    // contentAttestationUid,
    // identitySeedUid: identityAttestationUid,
    displayNameSchemaUid,
    profileSchemaUid,
    uriSchemaUid,
    labelSchemaUid,
    linkSchemaUid,
    identityUids,
    modelUids,
  }
}
