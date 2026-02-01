import { ethers } from "ethers";

export interface VaultData {
  id: number;
  creator: string;
  name: string;
  description: string;
  guardians: string[];
  approvalThreshold: number;
  isActive: boolean;
  createdAt: number;
}

export interface DocumentData {
  id: number;
  vaultId: number;
  encryptedMetadata: string;
  ipfsHash: string;
  uploadedBy: string;
  uploadedAt: number;
  requiredAccess: number;
}

export interface TokenData {
  tokenId: number;
  owner: string;
  vaultId: number | null;
  tokenURI: string;
  mintedAt: number | null;
}

export interface ActivityEvent {
  action: string;
  actor: string;
  timestamp: number;
  status: "success" | "pending";
}

const CONTRACT_ABI = [
  "function createVault(string name, string description, address[] guardians, uint256 approvalThreshold) external returns (uint256)",
  "function addDocument(uint256 vaultId, string encryptedMetadata, string ipfsHash, uint8 requiredAccess) external returns (uint256)",
  "function requestAccess(uint256 documentId) external returns (uint256)",
  "function approveAccess(uint256 requestId) external",
  "function revokeAccess(uint256 documentId, address user) external",
  "function mintAccessToken(uint256 vaultId, address to, string tokenURI) external returns (uint256)",
  "function burnAccessToken(uint256 tokenId) external",
  "function getVault(uint256 vaultId) external view returns (uint256, address, string, string, address[], uint256, bool, uint256)",
  "function documents(uint256 documentId) external view returns (uint256, uint256, string, string, address, uint256, uint8)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function totalSupply() external view returns (uint256)",
  "event VaultCreated(uint256 indexed vaultId, address indexed creator, string name)",
  "event DocumentAdded(uint256 indexed documentId, uint256 indexed vaultId, string ipfsHash)",
  "event AccessRequested(uint256 indexed requestId, uint256 indexed documentId, address indexed requester)",
  "event AccessApproved(uint256 indexed requestId, address indexed approver)",
  "event AccessGranted(uint256 indexed requestId, uint256 indexed documentId, address indexed requester)",
  "event NFTMinted(uint256 indexed tokenId, address indexed to, uint256 indexed vaultId)",
  "event NFTBurned(uint256 indexed tokenId)",
];

let provider: ethers.Provider | null = null;
let readContract: ethers.Contract | null = null;
let writeContract: ethers.Contract | null = null;
let verifiedAddress: string | null = null;
let hasVerifiedCode = false;

const getContractAddress = (): string => {
  const address = import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined;
  if (!address) {
    throw new Error("VITE_CONTRACT_ADDRESS is not set");
  }
  return address;
};

const ensureProvider = (): ethers.Provider => {
  if (!provider) {
    throw new Error("Provider not initialized");
  }
  return provider;
};

const ensureContractDeployed = async (): Promise<void> => {
  const activeProvider = ensureProvider();
  const address = getContractAddress();

  if (hasVerifiedCode && verifiedAddress === address) {
    return;
  }

  const code = await activeProvider.getCode(address);
  if (!code || code === "0x") {
    throw new Error("Contract not found at VITE_CONTRACT_ADDRESS");
  }

  verifiedAddress = address;
  hasVerifiedCode = true;
};

const ensureReadContract = (): ethers.Contract => {
  if (!readContract) {
    throw new Error("Contract not initialized");
  }
  return readContract;
};

const ensureWriteContract = (): ethers.Contract => {
  if (!writeContract) {
    throw new Error("Write contract not initialized");
  }
  return writeContract;
};

const getInterface = (): ethers.Interface => new ethers.Interface(CONTRACT_ABI);

const getLogChunkSize = (): number => {
  const configured = Number(import.meta.env.VITE_LOG_CHUNK_SIZE);
  if (!Number.isNaN(configured) && configured > 0) {
    return configured;
  }
  return 2000;
};

const getFromBlock = async (): Promise<number> => {
  const configured = Number(import.meta.env.VITE_CONTRACT_DEPLOY_BLOCK);
  if (!Number.isNaN(configured) && configured > 0) {
    return configured;
  }

  const activeProvider = ensureProvider();
  const latest = await activeProvider.getBlockNumber();
  const fallbackRange = 200000;
  return Math.max(0, latest - fallbackRange);
};

const getEventLogs = async (eventName: string) => {
  const activeProvider = ensureProvider();
  const address = getContractAddress();
  const iface = getInterface();
  const event = iface.getEvent(eventName);
  if (!event) {
    throw new Error(`Event ${eventName} not found in ABI`);
  }
  const topics = iface.encodeFilterTopics(event, []);
  const fromBlock = await getFromBlock();
  const toBlock = await activeProvider.getBlockNumber();
  const startBlock = Math.min(fromBlock, toBlock);
  const chunkSize = getLogChunkSize();
  const logs: ethers.Log[] = [];

  for (let current = startBlock; current <= toBlock; current += chunkSize) {
    const end = Math.min(current + chunkSize - 1, toBlock);
    let chunk: ethers.Log[];
    try {
      chunk = await activeProvider.getLogs({
        address,
        fromBlock: current,
        toBlock: end,
        topics,
      });
    } catch (error: any) {
      const hint = "Log query failed. Set VITE_CONTRACT_DEPLOY_BLOCK to the contract deploy block.";
      const detail = error?.message ? ` ${error.message}` : "";
      throw new Error(`[${eventName}] ${hint}${detail}`);
    }
    logs.push(...chunk);
  }

  const parsedLogs = logs
    .map((log) => {
      const parsed = iface.parseLog(log);
      if (!parsed) return null;
      return { log, parsed };
    })
    .filter((entry): entry is { log: ethers.Log; parsed: ethers.LogDescription } => entry !== null);

  return parsedLogs;
};

const getBlockTimestamp = async (
  blockNumber: number,
  cache: Map<number, number>
): Promise<number> => {
  if (cache.has(blockNumber)) {
    return cache.get(blockNumber)!;
  }
  const activeProvider = ensureProvider();
  const block = await activeProvider.getBlock(blockNumber);
  const timestamp = block ? Number(block.timestamp) : 0;
  cache.set(blockNumber, timestamp);
  return timestamp;
};

const initialize = (
  providerInput: ethers.Provider,
  signerInput?: ethers.Signer
): void => {
  provider = providerInput;

  const address = getContractAddress();
  readContract = new ethers.Contract(address, CONTRACT_ABI, providerInput);
  writeContract = signerInput
    ? new ethers.Contract(address, CONTRACT_ABI, signerInput)
    : null;
};

const clear = (): void => {
  provider = null;
  readContract = null;
  writeContract = null;
  verifiedAddress = null;
  hasVerifiedCode = false;
};

const isReady = (): boolean => !!readContract;

const createVault = async (
  name: string,
  description: string,
  guardians: string[],
  approvalThreshold: number
): Promise<number> => {
  const contract = ensureWriteContract();
  const tx = await contract.createVault(
    name,
    description,
    guardians,
    approvalThreshold
  );
  const receipt = await tx.wait();

  if (!receipt) {
    return 0;
  }

  const iface = getInterface();
  for (const log of receipt.logs ?? []) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === "VaultCreated") {
        return Number(parsed.args.vaultId);
      }
    } catch {
      // ignore non-matching logs
    }
  }

  return 0;
};

const addDocument = async (
  vaultId: number,
  encryptedMetadata: string,
  ipfsHash: string,
  requiredAccess: number
): Promise<number> => {
  const contract = ensureWriteContract();
  const tx = await contract.addDocument(
    vaultId,
    encryptedMetadata,
    ipfsHash,
    requiredAccess
  );
  const receipt = await tx.wait();

  if (!receipt) {
    return 0;
  }

  const iface = getInterface();
  for (const log of receipt.logs ?? []) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === "DocumentAdded") {
        return Number(parsed.args.documentId);
      }
    } catch {
      // ignore non-matching logs
    }
  }

  return 0;
};

const mintAccessToken = async (
  vaultId: number,
  to: string,
  tokenURI: string
): Promise<number> => {
  const contract = ensureWriteContract();
  const tx = await contract.mintAccessToken(vaultId, to, tokenURI);
  const receipt = await tx.wait();

  if (!receipt) {
    return 0;
  }

  const iface = getInterface();
  for (const log of receipt.logs ?? []) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === "NFTMinted") {
        return Number(parsed.args.tokenId);
      }
    } catch {
      // ignore non-matching logs
    }
  }

  return 0;
};

const burnAccessToken = async (tokenId: number): Promise<void> => {
  const contract = ensureWriteContract();
  const tx = await contract.burnAccessToken(tokenId);
  await tx.wait();
};

const fetchVaults = async (): Promise<VaultData[]> => {
  await ensureContractDeployed();
  const contract = ensureReadContract();
  const logs = await getEventLogs("VaultCreated");
  const ids = Array.from(
    new Set(logs.map((entry) => Number(entry.parsed.args.vaultId)))
  );

  const vaults = await Promise.all(ids.map((id) => contract.getVault(id)));
  return vaults.map((vault) => ({
    id: Number(vault[0]),
    creator: vault[1],
    name: vault[2],
    description: vault[3],
    guardians: vault[4],
    approvalThreshold: Number(vault[5]),
    isActive: vault[6],
    createdAt: Number(vault[7]),
  }));
};

const fetchDocuments = async (): Promise<DocumentData[]> => {
  await ensureContractDeployed();
  const contract = ensureReadContract();
  const logs = await getEventLogs("DocumentAdded");
  const ids = Array.from(
    new Set(logs.map((entry) => Number(entry.parsed.args.documentId)))
  );

  const documents = await Promise.all(
    ids.map((id) => contract.documents(id))
  );

  return documents.map((doc) => ({
    id: Number(doc[0]),
    vaultId: Number(doc[1]),
    encryptedMetadata: doc[2],
    ipfsHash: doc[3],
    uploadedBy: doc[4],
    uploadedAt: Number(doc[5]),
    requiredAccess: Number(doc[6]),
  }));
};

const getTotalSupply = async (): Promise<number> => {
  await ensureContractDeployed();
  const contract = ensureReadContract();
  const total = await contract.totalSupply();
  return Number(total);
};

const fetchUserTokens = async (account: string): Promise<TokenData[]> => {
  await ensureContractDeployed();
  const contract = ensureReadContract();
  const balance = await contract.balanceOf(account);
  const count = Number(balance);

  const tokenIds = await Promise.all(
    Array.from({ length: count }, (_, index) =>
      contract.tokenOfOwnerByIndex(account, index)
    )
  );

  const mintedLogs = await getEventLogs("NFTMinted");
  const mintedByToken = new Map<number, { vaultId: number; blockNumber: number }>();
  for (const entry of mintedLogs) {
    const tokenId = Number(entry.parsed.args.tokenId);
    mintedByToken.set(tokenId, {
      vaultId: Number(entry.parsed.args.vaultId),
      blockNumber: entry.log.blockNumber,
    });
  }

  const blockCache = new Map<number, number>();

  const tokens = await Promise.all(
    tokenIds.map(async (tokenIdValue) => {
      const tokenId = Number(tokenIdValue);
      let tokenURI = "";
      try {
        tokenURI = await contract.tokenURI(tokenId);
      } catch {
        tokenURI = "";
      }

      const mintedInfo = mintedByToken.get(tokenId);
      const mintedAt = mintedInfo
        ? await getBlockTimestamp(mintedInfo.blockNumber, blockCache)
        : null;

      return {
        tokenId,
        owner: account,
        vaultId: mintedInfo ? mintedInfo.vaultId : null,
        tokenURI,
        mintedAt,
      };
    })
  );

  return tokens;
};

const getRecentActivity = async (limit = 5): Promise<ActivityEvent[]> => {
  await ensureContractDeployed();
  const contract = ensureReadContract();
  const [vaultLogs, documentLogs, requestLogs, nftLogs] = await Promise.all([
    getEventLogs("VaultCreated"),
    getEventLogs("DocumentAdded"),
    getEventLogs("AccessRequested"),
    getEventLogs("NFTMinted"),
  ]);

  const allLogs = [
    ...vaultLogs,
    ...documentLogs,
    ...requestLogs,
    ...nftLogs,
  ];

  allLogs.sort((a, b) => {
    if (a.log.blockNumber !== b.log.blockNumber) {
      return b.log.blockNumber - a.log.blockNumber;
    }
    return b.log.index - a.log.index;
  });

  const blockCache = new Map<number, number>();

  const limited = allLogs.slice(0, limit);
  const events = await Promise.all(
    limited.map(async (entry) => {
      const timestamp = await getBlockTimestamp(entry.log.blockNumber, blockCache);
      const name = entry.parsed.name;

      if (name === "VaultCreated") {
        return {
          action: "Vault Created",
          actor: entry.parsed.args.creator,
          timestamp,
          status: "success" as const,
        };
      }

      if (name === "DocumentAdded") {
        try {
          const doc = await contract.documents(Number(entry.parsed.args.documentId));
          return {
            action: "Document Added",
            actor: doc[4],
            timestamp,
            status: "success" as const,
          };
        } catch {
          return {
            action: "Document Added",
            actor: "Unknown",
            timestamp,
            status: "success" as const,
          };
        }
      }

      if (name === "AccessRequested") {
        return {
          action: "Access Requested",
          actor: entry.parsed.args.requester,
          timestamp,
          status: "pending" as const,
        };
      }

      if (name === "NFTMinted") {
        return {
          action: "NFT Minted",
          actor: entry.parsed.args.to,
          timestamp,
          status: "success" as const,
        };
      }

      return {
        action: "Activity",
        actor: "Unknown",
        timestamp,
        status: "success" as const,
      };
    })
  );

  return events;
};

export const contractService = {
  initialize,
  clear,
  isReady,
  createVault,
  addDocument,
  mintAccessToken,
  burnAccessToken,
  fetchVaults,
  fetchDocuments,
  fetchUserTokens,
  getTotalSupply,
  getRecentActivity,
};

