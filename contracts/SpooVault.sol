// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SpooVault
 * @dev Decentralized NFT-powered multi-signature encrypted document vault
 */
contract SpooVault is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    Counters.Counter private _vaultIdCounter;
    Counters.Counter private _documentIdCounter;
    
    enum RequestStatus { PENDING, APPROVED, REJECTED, EXPIRED }
    enum AccessLevel { READ, READ_WRITE, ADMIN }
    
    struct Vault {
        uint256 id;
        address creator;
        string name;
        string description;
        address[] guardians;
        uint256 approvalThreshold;
        bool isActive;
        uint256 createdAt;
    }
    
    struct Document {
        uint256 id;
        uint256 vaultId;
        string encryptedMetadata;
        string ipfsHash;
        address uploadedBy;
        uint256 uploadedAt;
        AccessLevel requiredAccess;
    }
    
    struct AccessRequest {
        uint256 requestId;
        uint256 documentId;
        address requester;
        address[] approvedBy;
        RequestStatus status;
        uint256 expiresAt;
        uint256 createdAt;
    }
    
    struct GuardianInvite {
        address guardian;
        uint256 vaultId;
        bool accepted;
        uint256 expiresAt;
    }
    
    // Mappings
    mapping(uint256 => Vault) public vaults;
    mapping(uint256 => Document) public documents;
    mapping(uint256 => AccessRequest) public accessRequests;
    mapping(uint256 => mapping(address => bool)) public isGuardian;
    mapping(uint256 => mapping(address => bool)) public hasAccess;
    mapping(uint256 => mapping(address => AccessLevel)) public userAccessLevel;
    mapping(address => GuardianInvite[]) public guardianInvites;
    mapping(uint256 => mapping(address => bool)) public hasApprovedRequest;
    mapping(uint256 => string) public tokenURIs;
    
    // Events
    event VaultCreated(uint256 indexed vaultId, address indexed creator, string name);
    event GuardianAdded(uint256 indexed vaultId, address indexed guardian);
    event GuardianRemoved(uint256 indexed vaultId, address indexed guardian);
    event DocumentAdded(uint256 indexed documentId, uint256 indexed vaultId, string ipfsHash);
    event AccessRequested(uint256 indexed requestId, uint256 indexed documentId, address indexed requester);
    event AccessApproved(uint256 indexed requestId, address indexed approver);
    event AccessGranted(uint256 indexed requestId, uint256 indexed documentId, address indexed requester);
    event NFTMinted(uint256 indexed tokenId, address indexed to, uint256 indexed vaultId);
    event NFTBurned(uint256 indexed tokenId);
    event AccessRevoked(uint256 indexed documentId, address indexed user);
    
    constructor() ERC721("SpooVault Access Token", "SPVT") Ownable(msg.sender) {}
    
    /**
     * @dev Create a new vault with multi-signature guardians
     */
    function createVault(
        string memory name,
        string memory description,
        address[] memory guardians,
        uint256 approvalThreshold
    ) external returns (uint256) {
        require(guardians.length > 0, "At least one guardian required");
        require(approvalThreshold > 0 && approvalThreshold <= guardians.length, 
                "Invalid approval threshold");
        
        _vaultIdCounter.increment();
        uint256 vaultId = _vaultIdCounter.current();
        
        Vault storage newVault = vaults[vaultId];
        newVault.id = vaultId;
        newVault.creator = msg.sender;
        newVault.name = name;
        newVault.description = description;
        newVault.approvalThreshold = approvalThreshold;
        newVault.isActive = true;
        newVault.createdAt = block.timestamp;
        
        // Add creator as first guardian
        newVault.guardians.push(msg.sender);
        isGuardian[vaultId][msg.sender] = true;
        
        // Add other guardians
        for (uint i = 0; i < guardians.length; i++) {
            if (guardians[i] != msg.sender) {
                newVault.guardians.push(guardians[i]);
                isGuardian[vaultId][guardians[i]] = true;
                
                // Create guardian invite
                guardianInvites[guardians[i]].push(GuardianInvite({
                    guardian: guardians[i],
                    vaultId: vaultId,
                    accepted: false,
                    expiresAt: block.timestamp + 7 days
                }));
            }
        }
        
        emit VaultCreated(vaultId, msg.sender, name);
        return vaultId;
    }
    
    /**
     * @dev Accept guardian invitation
     */
    function acceptGuardianInvite(uint256 vaultId) external {
        require(vaults[vaultId].isActive, "Vault not active");
        
        bool found = false;
        GuardianInvite[] storage invites = guardianInvites[msg.sender];
        
        for (uint i = 0; i < invites.length; i++) {
            if (invites[i].vaultId == vaultId && !invites[i].accepted) {
                require(invites[i].expiresAt > block.timestamp, "Invite expired");
                invites[i].accepted = true;
                found = true;
                break;
            }
        }
        
        require(found, "No valid invitation found");
        emit GuardianAdded(vaultId, msg.sender);
    }
    
    /**
     * @dev Add document to vault (encrypted metadata + IPFS hash)
     */
    function addDocument(
        uint256 vaultId,
        string memory encryptedMetadata,
        string memory ipfsHash,
        AccessLevel requiredAccess
    ) external returns (uint256) {
        require(vaults[vaultId].isActive, "Vault not active");
        require(isGuardian[vaultId][msg.sender], "Only guardians can add documents");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        
        _documentIdCounter.increment();
        uint256 documentId = _documentIdCounter.current();
        
        documents[documentId] = Document({
            id: documentId,
            vaultId: vaultId,
            encryptedMetadata: encryptedMetadata,
            ipfsHash: ipfsHash,
            uploadedBy: msg.sender,
            uploadedAt: block.timestamp,
            requiredAccess: requiredAccess
        });
        
        // Grant access to uploader
        hasAccess[documentId][msg.sender] = true;
        userAccessLevel[documentId][msg.sender] = AccessLevel.ADMIN;
        
        emit DocumentAdded(documentId, vaultId, ipfsHash);
        return documentId;
    }
    
    /**
     * @dev Request access to a document
     */
    function requestAccess(uint256 documentId) external returns (uint256) {
        require(documents[documentId].id != 0, "Document does not exist");
        require(!hasAccess[documentId][msg.sender], "Already has access");
        
        // Check if user owns an NFT for this vault
        uint256 vaultId = documents[documentId].vaultId;
        bool hasNFT = false;
        
        for (uint256 i = 0; i < balanceOf(msg.sender); i++) {
            uint256 tokenId = tokenOfOwnerByIndex(msg.sender, i);
            if (tokenVaultMapping[tokenId] == vaultId) {
                hasNFT = true;
                break;
            }
        }
        
        require(hasNFT, "NFT required for access request");
        
        // Create access request
        uint256 requestId = uint256(keccak256(abi.encodePacked(
            documentId, msg.sender, block.timestamp
        )));
        
        accessRequests[requestId] = AccessRequest({
            requestId: requestId,
            documentId: documentId,
            requester: msg.sender,
            approvedBy: new address[](0),
            status: RequestStatus.PENDING,
            expiresAt: block.timestamp + 3 days,
            createdAt: block.timestamp
        });
        
        emit AccessRequested(requestId, documentId, msg.sender);
        return requestId;
    }
    
    /**
     * @dev Approve access request (guardian only)
     */
    function approveAccess(uint256 requestId) external {
        AccessRequest storage request = accessRequests[requestId];
        require(request.status == RequestStatus.PENDING, "Request not pending");
        require(request.expiresAt > block.timestamp, "Request expired");
        
        uint256 vaultId = documents[request.documentId].vaultId;
        require(isGuardian[vaultId][msg.sender], "Only guardians can approve");
        require(!hasApprovedRequest[requestId][msg.sender], "Already approved");
        
        hasApprovedRequest[requestId][msg.sender] = true;
        request.approvedBy.push(msg.sender);
        
        emit AccessApproved(requestId, msg.sender);
        
        // Check if threshold reached
        if (request.approvedBy.length >= vaults[vaultId].approvalThreshold) {
            request.status = RequestStatus.APPROVED;
            grantAccess(request.documentId, request.requester);
        }
    }
    
    /**
     * @dev Grant access to document
     */
    function grantAccess(uint256 documentId, address user) internal {
        hasAccess[documentId][user] = true;
        userAccessLevel[documentId][user] = documents[documentId].requiredAccess;
        
        emit AccessGranted(documentId, documentId, user);
    }
    
    /**
     * @dev Revoke access from user
     */
    function revokeAccess(uint256 documentId, address user) external {
        require(documents[documentId].id != 0, "Document does not exist");
        uint256 vaultId = documents[documentId].vaultId;
        require(isGuardian[vaultId][msg.sender], "Only guardians can revoke access");
        
        hasAccess[documentId][user] = false;
        delete userAccessLevel[documentId][user];
        
        emit AccessRevoked(documentId, user);
    }
    
    /**
     * @dev Mint NFT access token
     */
    function mintAccessToken(uint256 vaultId, address to, string memory tokenURI) 
        external returns (uint256) {
        require(vaults[vaultId].isActive, "Vault not active");
        require(isGuardian[vaultId][msg.sender], "Only guardians can mint tokens");
        
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        _safeMint(to, tokenId);
        tokenURIs[tokenId] = tokenURI;
        tokenVaultMapping[tokenId] = vaultId;
        
        emit NFTMinted(tokenId, to, vaultId);
        return tokenId;
    }
    
    /**
     * @dev Burn NFT access token (revoke all access)
     */
    function burnAccessToken(uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not token owner or approved");
        
        uint256 vaultId = tokenVaultMapping[tokenId];
        
        // Revoke all document access for this vault
        for (uint256 i = 1; i <= _documentIdCounter.current(); i++) {
            if (documents[i].vaultId == vaultId) {
                hasAccess[i][ownerOf(tokenId)] = false;
                delete userAccessLevel[i][ownerOf(tokenId)];
            }
        }
        
        _burn(tokenId);
        delete tokenVaultMapping[tokenId];
        delete tokenURIs[tokenId];
        
        emit NFTBurned(tokenId);
    }
    
    /**
     * @dev Get vault details
     */
    function getVault(uint256 vaultId) external view returns (
        uint256 id,
        address creator,
        string memory name,
        string memory description,
        address[] memory guardians,
        uint256 approvalThreshold,
        bool isActive,
        uint256 createdAt
    ) {
        Vault storage vault = vaults[vaultId];
        return (
            vault.id,
            vault.creator,
            vault.name,
            vault.description,
            vault.guardians,
            vault.approvalThreshold,
            vault.isActive,
            vault.createdAt
        );
    }
    
    /**
     * @dev Get user's pending invites
     */
    function getPendingInvites(address user) external view returns (GuardianInvite[] memory) {
        GuardianInvite[] storage invites = guardianInvites[user];
        uint256 count = 0;
        
        for (uint256 i = 0; i < invites.length; i++) {
            if (!invites[i].accepted && invites[i].expiresAt > block.timestamp) {
                count++;
            }
        }
        
        GuardianInvite[] memory pending = new GuardianInvite[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < invites.length; i++) {
            if (!invites[i].accepted && invites[i].expiresAt > block.timestamp) {
                pending[index] = invites[i];
                index++;
            }
        }
        
        return pending;
    }
    
    // Override required functions
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }
    
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    // Additional mapping for token to vault
    mapping(uint256 => uint256) private tokenVaultMapping;
}
