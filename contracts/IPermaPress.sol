// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./IEAS_PermaPress.sol";

struct PropertyToUpdateWithSeed {
    string publishLocalId;
    bytes32 propertySchemaUid;
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


interface IPermaPress {

}
