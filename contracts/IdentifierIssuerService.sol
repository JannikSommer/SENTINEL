// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/utils/Strings.sol";
import "./MessageControlable.sol";

/// @title Identifier Issuer Service smart contract for the SENTINEL system.
/// @author Jannik Lucas Sommer & Magnus Mølgaard Lund.
/// @notice The smart contract is only responsible for issuing vulnerability identifiers
///         for vulnerabilities disclosed with the SENTINEL system. 
contract IdentifierIssuerService is MessageControlable {
  uint64 private vendorCount = 0;

  // VendorContractAddress => VendorId
  mapping(address => uint64) private vendors;

  // VendorId => VulnerabilityId
  mapping(uint64 => uint64[]) private vulnerabilites;

  // VendorId => AdvisoryId
  mapping(uint64 => uint64[]) private advisories;

  /// @notice Registers a vendor smart contract for this service. 
  /// @dev A smart contract can only be regisered once. 
  function registerVendor() external onlyContract returns (uint64) {
    require(vendors[msg.sender] == 0, "Vendors can only register once"); // Vendor is not registered already
    vendorCount++;
    vendors[msg.sender] = vendorCount;
    return vendorCount;
  }

  /// @notice Generates a new vulnerability identifier for a given vendor. 
  /// @return string of the new identifier generated. 
  function requestVulnerabilityIdentifiers(uint16 count) external onlyContract returns (string memory) {
    require(vendors[msg.sender] != 0, "Vendor must be registered");
    uint64 vendorId = vendors[msg.sender];
    string memory ids = "";

    for (uint16 index = 0; index < count; index++) {
      vulnerabilites[vendorId].push(uint64(vulnerabilites[vendorId].length + 1));
      uint64 vulnerabilityNumber = uint64(vulnerabilites[vendorId].length);
      string memory id = string.concat("SNTL-V-", Strings.toString(vendorId), "-", Strings.toString(vulnerabilityNumber));
      if (index != 0) 
        ids = string.concat(ids, ",", id);
      else 
        ids = string.concat(ids, id); 
    }

    return ids;
  }

  /// @notice Generates a new advisory identifier for a given vendor. 
  /// @return string of the new identifier generated. 
  function requestAdvisoryIdentifier() external onlyContract returns (string memory) {
    require(vendors[msg.sender] != 0, "Vendor must be registered");
    uint64 vendorId = vendors[msg.sender];

    advisories[vendorId].push(uint64(advisories[vendorId].length + 1));
    uint64 advisoryNumber = uint64(advisories[vendorId].length);

    return string.concat("SNTL-A-", Strings.toString(vendorId), "-", Strings.toString(advisoryNumber));
  }

  /// @notice Getter for a vendor identifier from a given address. 
  /// @return uint64 for the given vendor address or 0 for unregistered vendors. 
  function getVendorId(address vendorAddress) public view returns (uint64) {
    return vendors[vendorAddress];
  }

  /// @notice Retrieves all the vulnerability identifiers for a given vendor.
  /// @return string[] of vulnerability indentifiers for a given vendor. 
  function getVulnerabilities(uint64 vendorId) public view returns (string[] memory) {
    uint64[] memory vulnIds = vulnerabilites[vendorId];
    string[] memory result = new string[](vulnIds.length);

    for (uint64 index = 0; index < vulnIds.length; index++) {
      result[index] = string.concat("SNTL-V-", Strings.toString(vendorId), "-", Strings.toString(vulnIds[index]));
    }

    return result;
  }
}
