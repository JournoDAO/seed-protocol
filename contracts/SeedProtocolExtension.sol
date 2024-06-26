// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../interfaces/IEAS.sol";
import "../interfaces/ISeedProtocol.sol";
import "@openzeppelin/contracts/utils/Strings.sol";



library SeedProtocolStorage {
    /// @custom:storage-location erc7201:extensions.seedprotocol.storage
    /// @dev keccak256(abi.encode(uint256(keccak256("extensions.seedprotocol.storage")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 public constant SEED_PROTOCOL_STORAGE_POSITION = keccak256(abi.encode(uint256(keccak256("extensions.seedprotocol.storage")) - 1)) & ~bytes32(uint256(0xff));

    struct Data {
        /// @dev Local EAS contract reference
        IEAS eas;
    }

    function data() internal pure returns (Data storage data_) {
        bytes32 position = SEED_PROTOCOL_STORAGE_POSITION;
        assembly {
            data_.slot := position
        }
    }
}

contract SeedProtocolExtension is ISeedProtocol, OwnableUpgradeable {

    event CreatedAttestation(CreatedAttestationResult result);
    event SeedPublished(bytes returnedDataFromEAS);
    event Log(string message);

    function initialize(
        address _eas
    ) public initializer {
        _seedProtocolStorage().eas = IEAS(_eas);
    }

    /*///////////////////////////////////////////////////////////////
                            External functions
    //////////////////////////////////////////////////////////////*/

    function createSeed(bytes32 schemaUid, bool revocable) public payable returns (bytes32) {

        // Prepare the Seed attestation
        AttestationRequestData memory seedData = AttestationRequestData({
            recipient: address(0),
            expirationTime: 0,
            revocable: revocable,
            refUID: bytes32(0),
            data: abi.encode(schemaUid),
            value: uint256(0)
        });

        AttestationRequest memory seedRequest = AttestationRequest({
            schema: schemaUid,
            data: seedData
        });

        bytes32 seedUid = _seedProtocolStorage().eas.attest(seedRequest);

        require(seedUid != bytes32(0), "Failed to create seed with EAS");

        emit CreatedAttestation(CreatedAttestationResult({
            schemaUid: schemaUid,
            attestationUid: seedUid
        }));

        return seedUid;
    }

    function createVersion(bytes32 seedUid, bytes32 versionSchemaUid) public payable returns (bytes32) {

        // Prepare the Version attestation
        AttestationRequestData memory versionData = AttestationRequestData({
            recipient: address(0),
            expirationTime: 0,
            revocable: true,
            refUID: seedUid,
            data: abi.encode(versionSchemaUid),
            value: uint256(0)
        });

        AttestationRequest memory versionRequest = AttestationRequest({
            schema: versionSchemaUid,
            data: versionData
        });

        bytes32 versionUid = _seedProtocolStorage().eas.attest(versionRequest);

        require(versionUid != bytes32(0), "Failed to create version with EAS");

        emit CreatedAttestation(CreatedAttestationResult({
            schemaUid: versionSchemaUid,
            attestationUid: versionUid
        }));

        return versionUid;
    }

    function publish(PublishRequestData memory request) public payable returns (bytes32, bytes32) {

        bytes32 seedUid = request.seedUid;
        bytes32 versionUid = request.versionUid;

        if (seedUid == bytes32(0)) {
            seedUid = createSeed(request.seedSchemaUid, request.seedIsRevocable);
        }

        if (seedUid != bytes32(0) && versionUid == bytes32(0)) {
            versionUid = createVersion(seedUid, request.versionSchemaUid);
        }

        return (seedUid, versionUid);
    }

    function multiPublish(PublishRequestData[] memory requests) public payable returns (bytes32[] memory) {
        bytes32[] memory result = new bytes32[](requests.length);

        for (uint i = 0; i < requests.length; i++) {
            PublishRequestData memory requestToPublish = requests[i];
            // Each publish call can return a list of properties that need to be updated
            (bytes32 newSeedUid, bytes32 newVersionUid) = publish(requestToPublish);

            // Update the current request attestations with the newVersionUid as the refUID
            for (uint j = 0; j < requestToPublish.listOfAttestations.length; j++) {
                MultiAttestationRequest memory attestationRequest = requestToPublish.listOfAttestations[j];
                for (uint k = 0; k < attestationRequest.data.length; k++) {
                    attestationRequest.data[k].refUID = newVersionUid;
                }
            }

            // Update other requests that have properties that need to reference the newSeedUid
            PropertyToUpdateWithSeed[] memory propertiesToUpdate = requestToPublish.propertiesToUpdate;
            // For each property, we find the corresponding request and update the property's value as the seedUid
            for (uint l = 0; l < propertiesToUpdate.length; l++) {
                PropertyToUpdateWithSeed memory propertyToUpdate = propertiesToUpdate[l];
                for (uint m = 0; m < requests.length; m++) {
                    PublishRequestData memory targetForUpdate = requests[m];
                    if ( Strings.equal(targetForUpdate.localId, propertyToUpdate.publishLocalId)) {
                        for (uint n = 0; n < targetForUpdate.listOfAttestations.length; n++) {
                            MultiAttestationRequest memory attestationRequest = targetForUpdate.listOfAttestations[n];
                            if (attestationRequest.schema == propertyToUpdate.propertySchemaUid) {
                                attestationRequest.data[0].data = abi.encode(newSeedUid);
                            }
                        }
                    }
                }
            }

            // Call multiAttest with updated listOfAttestations
            (bool success, bytes memory returnedData) = address(_seedProtocolStorage().eas).call{ value: msg.value }(
                abi.encodeWithSelector(
                    _seedProtocolStorage().eas.multiAttest.selector,
                    requestToPublish.listOfAttestations
                )
            );

            require(success, "multiAttest call failed");

            emit SeedPublished(returnedData);

        }

        return result;


    }

    /// @dev Returns the SeedProtocol storage.
    function _seedProtocolStorage() internal pure returns (SeedProtocolStorage.Data storage data) {
        data = SeedProtocolStorage.data();
    }
}
