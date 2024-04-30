// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Signature, MultiAttestationRequest} from "./IEAS.sol";

struct CreateSeedRequest {
    bytes32 schemaUid;
    bool revocable;
    Signature signature;
}

struct PropertyToUpdateWithSeed {
    string publishLocalId;
    bytes32 propertySchemaUid;
}

struct QueuedUpdate {
    string publishLocalId;
    bytes32 propertySchemaUid;
    bytes32 createdSeedUid;
}

struct PublishRequestData {
    string localId;
    bytes32 seedUid;
    bytes32 seedSchemaUid;
    bytes32 versionUid;
    bytes32 versionSchemaUid;
    bool seedIsRevocable;
    MultiAttestationRequest[] listOfAttestations;
    PropertyToUpdateWithSeed[] propertiesToUpdate;
}

struct PublishReturnData {
    bytes32 seedUid;
    bytes32 versionUid;
}

struct CreatedAttestationResult {
    bytes32 schemaUid;
    bytes32 attestationUid;
}


interface ISeedProtocol {

}
