// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IEAS_PermaPress.sol";
import {AttestationRequest, MultiAttestationRequest} from "./IEAS_PermaPress.sol";
import {PublishRequestData, PublishReturnData, PropertyToUpdateWithSeed} from "./IPermaPress.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


contract PermaPress is OwnableUpgradeable {
    IEAS_PermaPress public eas;

    event Log(string message);
    event PublishResult(string jsonResult);

    function initialize(
        address _eas
    ) public initializer {
        eas = IEAS_PermaPress(_eas);
    }

    function createSeed(bytes32 schemaUid, bool revocable) public payable returns (bytes32) {

        emit Log("Calling createSeed");
        emit Log(string(abi.encodePacked(bytes32ToHexString(schemaUid))));

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

        bytes32 seedUid = eas.attest(seedRequest);

        return seedUid;
    }

    function createVersion(bytes32 seedUid, bytes32 versionSchemaUid) public payable returns (bytes32) {

        emit Log("Calling createVersion");
        emit Log(string(abi.encodePacked(bytes32ToHexString(versionSchemaUid))));
//        emit Log(string(abi.encodePacked(bytes32ToHexString(seedUid))));

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

        bytes32 versionUid = eas.attest(versionRequest);

        return versionUid;
    }

    // Utility function to convert bytes32 to string
    function bytes32ToString(bytes32 _bytes32) public pure returns (string memory) {
        bytes memory bytesArray = new bytes(32);
        for (uint256 i; i < 32; i++) {
            bytesArray[i] = _bytes32[i];
            if (_bytes32[i] == 0) {
                break;
            }
        }
        return string(bytesArray);
    }

    // Converts bytes32 to a hexadecimal string
    function bytes32ToHexString(bytes32 _bytes32) public pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(64); // Length of a hexadecimal representation of bytes32
        for (uint i = 0; i < 32; i++) {
            str[2 * i] = alphabet[uint8(_bytes32[i] >> 4)];
            str[2 * i + 1] = alphabet[uint8(_bytes32[i] & 0x0f)];
        }
        return string(str);
    }

    function convertBytesToString(bytes memory data) public pure returns (string memory) {
        return string(data);
    }


    function publish(PublishRequestData memory request) public payable returns (bytes32, bytes32) {

        emit Log("Calling publish");

        bytes32 seedUid = request.seedUid;
        bytes32 versionUid = request.versionUid;

        if (seedUid == bytes32(0)) {
            seedUid = createSeed(request.seedSchemaUid, request.seedIsRevocable);
            emit Log("Created seedUid");
            emit Log(string(abi.encodePacked(bytes32ToHexString(seedUid))));
        }

        if (seedUid != bytes32(0) && versionUid == bytes32(0)) {
            versionUid = createVersion(seedUid, request.versionSchemaUid);
            emit Log("Created versionUid");
            emit Log(string(abi.encodePacked(bytes32ToHexString(versionUid))));
        }

        // Create updated listOfAttestations with versionUid as refUID
        for (uint k = 0; k < request.listOfAttestations.length; k++) {
            for (uint l = 0; l < request.listOfAttestations[k].data.length; l++) {
                // Prepare data for each attestation, referencing the Version UID
                request.listOfAttestations[k].data[l].refUID = versionUid;
                emit Log("Attached versionUid to attestation");
                emit Log(string(abi.encodePacked(bytes32ToHexString(versionUid))));
            }
        }

        return (seedUid, versionUid);
    }

    function multiPublish(PublishRequestData[] memory requests) public payable returns (bytes32[] memory) {
        bytes32[] memory result = new bytes32[](requests.length);
//        PropertyToUpdateWithSeed[] memory propertiesToUpdate = new PropertyToUpdateWithSeed[](0);
        for (uint i = 0; i < requests.length; i++) {
            PublishRequestData memory requestToPublish = requests[i];
            // Each publish call can return a list of properties that need to be updated
            (bytes32 newSeedUid, bytes32 newVersionUid) = publish(requestToPublish);
            PropertyToUpdateWithSeed[] memory propertiesToUpdate = requestToPublish.propertiesToUpdate;
            // For each property, we find the corresponding request and update the property's value as the seedUid
            for (uint j = 0; j < propertiesToUpdate.length; j++) {
                PropertyToUpdateWithSeed memory propertyToUpdate = propertiesToUpdate[j];
                for (uint k = 0; k < requests.length; k++) {
                    if ( Strings.equal(requests[k].localId, propertyToUpdate.publishLocalId)) {
                        for (uint l = 0; l < requests[k].propertiesToUpdate.length; l++) {
                            MultiAttestationRequest[] memory listOfAttestations = requestToPublish.listOfAttestations;
                            for (uint m = 0; m < listOfAttestations.length; m++) {
                                MultiAttestationRequest memory attestationRequest = listOfAttestations[m];
//                                attestationRequest.data[0].refUID = newVersionUid;
//                                emit Log("Added newVersionUid to refUID of attestation data");
//                                emit Log(string(abi.encodePacked(bytes32ToHexString(newVersionUid))));
                                if (attestationRequest.schema == propertyToUpdate.propertySchemaUid) {
                                    attestationRequest.data[0].data = abi.encode(newSeedUid);
                                    emit Log("Added newSeedUid to attestation data");
                                    emit Log(string(abi.encodePacked(bytes32ToHexString(newSeedUid))));
                                }
                            }
                        }
                    }
                }
            }

            // Call multiAttest with updated listOfAttestations
            (bool success, bytes memory returnedData) = address(eas).call{ value: msg.value }(
                abi.encodeWithSelector(
                    eas.multiAttest.selector,
                    requestToPublish.listOfAttestations
                )
            );

            require(success, "multiAttest call failed");

//            string memory returnedDataString = "[";

//            bytes32[] memory newSeedAndVersion = abi.decode(returnedData, (bytes32[]));

//            string memory json = string(abi.encodePacked(
//                '{"seedUid": "', bytes32ToHexString(newSeedAndVersion[0]),
//                '", "versionUid": "', bytes32ToHexString(newSeedAndVersion[1]),
//                '"}'
//            ));

//            emit PublishResult(json);

        }

        return result;


    }
}
