import { EAS, SchemaRegistry } from '@ethereum-attestation-service/eas-sdk'

export type ModelName = string
export type ModelPropertyName = string
export type ModelProperty = {
  schemaUid: string
  schemaDefinition: string
  dataType: EasDataType
  ref?: ModelName
  list?: boolean
}
export type ModelInfo = {
  schemaUid: string
  schemaDefinition: string
  properties: {
    [key: ModelPropertyName]: ModelProperty
  }
}

interface ModelUids {
  [key: ModelName]: ModelInfo
}

export type ModelType = {
  info: PropertyInfo
  properties?: {
    [key: ModelPropertyName]: PropertyInfo
  }

}

// The Schema for the concept of a Model that's expressed through atomic attestations
interface ModelSchema {
  [key: ModelName]: ModelType
}

export type PropertyInfo = {
  name: string
  type: EasDataType
  ref?: string
  list?: boolean
  schemaUid?: string
}

// From this we should be able to generate a schema definition. For example:
// schemaProperties.length of 1: 'string avatar_image_uri'
// schemaProperties.length of 2: 'string transactionId,bytes32 storageProviderUid'
export type ModelProperty = {
  schemaProperties: PropertyInfo[]
}

export type EasDataType = 'bytes32' | 'bytes32[]' | 'string' | 'uint8' | 'uint256' | 'bool' | 'address' | 'bytes' | 'int8' | 'int256' | 'int'

export type ProcessModelSchemaParams = {
  modelSchema: ModelSchema
  schemaRegistry: SchemaRegistry
  nameASchemaUid: string
  eas: EAS
}

export type NameSchemaParams = {
  eas: EAS
  schemaUid: string
  schemaName: string
  nameASchemaUid: string
}

export type NameSchema = (params: NameSchemaParams) => Promise<void>

export type ProcessModelSchema = (params: ProcessModelSchemaParams) => Promise<ModelUids>

export type IdentitySchemaUids = {
  [key in SchemaUidKey]?: string | null | undefined
}

export type Link = {
  label?: string | null
  uri?: string | null
}

export type IdentityData = {
  [key in SchemaUidKey]?: string | Link[] | null
}

export type IdentityPropertyName = 'display_name' | 'profile' | 'avatar_image_uri' | 'links'
export type AdditionalPropertyNames = 'link' | 'label' | 'uri';

export type SchemaUidKey = IdentityPropertyName | AdditionalPropertyNames

export type DataFnParams = string | Link | Link[]

export type DataFnForPropertyNameType = {
  [key in SchemaUidKey]?: (( value: DataFnParams) => string)
}

export type SeedToCreate = {
  schemaUid: string
  revocable: boolean
  propertySchemaUid: string
  createdSeedUid?: string
}
