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

export interface AccessRequestData {
  requestId: number;
  documentId: number;
  requester: string;
  status: number;
  expiresAt: number;
  createdAt: number;
}

export interface PendingApprovalData {
  requestId: number;
  documentId: number;
  vaultId: number;
  vaultName: string;
  requester: string;
  createdAt: number;
  expiresAt: number;
}

export interface GuardianInviteData {
  guardian: string;
  vaultId: number;
  accepted: boolean;
  expiresAt: number;
}

export interface VaultReleaseState {
  emergencyMode: boolean;
  inactivityPeriod: number;
  lastProofOfLife: number;
  postDeathUnlocked: boolean;
}

const CONTRACT_ABI = [
  "function createVault(string name, string description, address[] guardians, uint256 approvalThreshold) external returns (uint256)",
  "function addDocument(uint256 vaultId, string encryptedMetadata, string ipfsHash, uint8 requiredAccess) external returns (uint256)",
  "function addDocumentWithReleaseCondition(uint256 vaultId, string encryptedMetadata, string ipfsHash, uint8 requiredAccess, uint8 releaseCondition) external returns (uint256)",
  "function configureVaultRelease(uint256 vaultId, uint256 inactivityPeriod) external",
  "function proveLife(uint256 vaultId) external",
  "function setEmergencyMode(uint256 vaultId, bool enabled) external",
  "function getVaultReleaseState(uint256 vaultId) external view returns (bool emergencyMode, uint256 inactivityPeriod, uint256 lastProofOfLife, bool postDeathUnlocked)",
  "function documentReleaseCondition(uint256 documentId) external view returns (uint8)",
  "function requestAccess(uint256 documentId) external returns (uint256)",
  "function approveAccess(uint256 requestId) external",
  "function acceptGuardianInvite(uint256 vaultId) external",
  "function accessRequests(uint256 requestId) external view returns (uint256 requestId, uint256 documentId, address requester, uint8 status, uint256 expiresAt, uint256 createdAt)",
  "function latestRequestId(uint256 documentId, address user) external view returns (uint256)",
  "function hasApprovedRequest(uint256 requestId, address approver) external view returns (bool)",
  "function getPendingInvites(address user) external view returns (tuple(address guardian, uint256 vaultId, bool accepted, uint256 expiresAt)[])",
  "function revokeAccess(uint256 documentId, address user) external",
  "function mintAccessToken(uint256 vaultId, address to, string tokenURI) external returns (uint256)",
  "function burnAccessToken(uint256 tokenId) external",
  "function getVault(uint256 vaultId) external view returns (uint256, address, string, string, address[], uint256, bool, uint256)",
  "function documents(uint256 documentId) external view returns (uint256, uint256, string, string, address, uint256, uint8)",
  "function hasActiveAccess(uint256 documentId, address user) external view returns (bool)",
  "function balanceOf(address owner) external view returns (uint256)",
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
  "event DocumentReleaseConditionSet(uint256 indexed documentId, uint8 condition)",
];

let provider: ethers.Provider | null = null;
let fallbackProviders: ethers.JsonRpcProvider[] = [];
let readContract: ethers.Contract | null = null;
let writeContract: ethers.Contract | null = null;
let verifiedAddress: string | null = null;
let hasVerifiedCode = false;

const FUJI_RPC_URLS = [
  "https://api.avax-test.network/ext/bc/C/rpc",
  "https://rpc.ankr.com/avalanche_fuji",
];

const MAINNET_RPC_URLS = [
  "https://api.avax.network/ext/bc/C/rpc",
  "https://rpc.ankr.com/avalanche",
];

const getContractAddress = (): string => {
  const address = import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined;
  if (!address) {
    throw new Error("VITE_CONTRACT_ADDRESS is not set");
  }
  return address;
};

const getRpcCandidates = (): string[] => {
  const configured = (import.meta.env.VITE_AVALANCHE_RPC as string | undefined)?.trim();
  const chainId = Number(import.meta.env.VITE_CHAIN_ID);
  const defaults = chainId === 43114 ? MAINNET_RPC_URLS : FUJI_RPC_URLS;
  const all = configured ? [configured, ...defaults] : [...defaults];

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const url of all) {
    const normalized = url.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    unique.push(normalized);
  }
  return unique;
};

const getConfiguredRpcProviders = (): ethers.JsonRpcProvider[] => {
  return getRpcCandidates().map((url) => new ethers.JsonRpcProvider(url));
};

const getReadProviders = (): ethers.Provider[] => {
  if (fallbackProviders.length > 0) {
    return [...fallbackProviders];
  }

  if (provider) {
    return [provider];
  }

  throw new Error("No read provider is initialized");
};

const extractProviderErrorMessage = (error: any): string => {
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }
  if (typeof error?.shortMessage === "string" && error.shortMessage.trim()) {
    return error.shortMessage;
  }
  return "Unknown provider error";
};

const getTxWaitTimeoutMs = (): number => {
  const configured = Number(import.meta.env.VITE_TX_WAIT_TIMEOUT_MS);
  if (!Number.isNaN(configured) && configured > 0) {
    return configured;
  }
  return 180000;
};

const waitForReceipt = async (tx: any) => {
  const timeoutMs = getTxWaitTimeoutMs();

  if (tx?.hash && fallbackProviders.length > 0) {
    for (const activeProvider of fallbackProviders) {
      try {
        const mined = await activeProvider.waitForTransaction(tx.hash, 1, timeoutMs);
        if (mined) {
          return mined;
        }
      } catch {
        // Try next provider, then fallback to signer provider below.
      }
    }
  }

  const receipt = await tx.wait(1, timeoutMs);
  if (!receipt) {
    throw new Error(
      "Transaction confirmation timed out. Check your wallet, then refresh and retry."
    );
  }

  return receipt;
};

const ensureContractDeployed = async (): Promise<void> => {
  const address = getContractAddress();

  if (hasVerifiedCode && verifiedAddress === address) {
    return;
  }

  let lastError: string | null = null;
  for (const activeProvider of getReadProviders()) {
    try {
      const code = await activeProvider.getCode(address);
      if (!code || code === "0x") {
        throw new Error("Contract not found at VITE_CONTRACT_ADDRESS");
      }
      verifiedAddress = address;
      hasVerifiedCode = true;
      return;
    } catch (error) {
      lastError = extractProviderErrorMessage(error);
    }
  }
  throw new Error(lastError || "Failed to verify contract deployment");
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

const contractHasFunction = (contract: ethers.Contract, signature: string): boolean => {
  try {
    contract.interface.getFunction(signature);
    return true;
  } catch {
    return false;
  }
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

  let lastError: string | null = null;
  for (const activeProvider of getReadProviders()) {
    try {
      const latest = await activeProvider.getBlockNumber();
      const fallbackRange = 200000;
      return Math.max(0, latest - fallbackRange);
    } catch (error) {
      lastError = extractProviderErrorMessage(error);
    }
  }
  throw new Error(lastError || "Failed to determine fromBlock");
};

const getEventLogs = async (eventName: string) => {
  const address = getContractAddress();
  const iface = getInterface();
  const event = iface.getEvent(eventName);
  if (!event) {
    throw new Error(`Event ${eventName} not found in ABI`);
  }
  const topics = iface.encodeFilterTopics(event, []);
  let logs: ethers.Log[] = [];
  let lastError: string | null = null;

  for (const activeProvider of getReadProviders()) {
    try {
      const fromBlock = await getFromBlock();
      const toBlock = await activeProvider.getBlockNumber();
      const startBlock = Math.min(fromBlock, toBlock);
      const chunkSize = getLogChunkSize();
      logs = [];

      for (let current = startBlock; current <= toBlock; current += chunkSize) {
        const end = Math.min(current + chunkSize - 1, toBlock);
        const chunk = await activeProvider.getLogs({
          address,
          fromBlock: current,
          toBlock: end,
          topics,
        });
        logs.push(...chunk);
      }
      lastError = null;
      break;
    } catch (error: any) {
      lastError = extractProviderErrorMessage(error);
    }
  }

  if (lastError) {
    const hint = "Log query failed. Set VITE_CONTRACT_DEPLOY_BLOCK to the contract deploy block.";
    throw new Error(`[${eventName}] ${hint} ${lastError}`);
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
  let lastError: string | null = null;

  for (const activeProvider of getReadProviders()) {
    try {
      const block = await activeProvider.getBlock(blockNumber);
      const timestamp = block ? Number(block.timestamp) : 0;
      cache.set(blockNumber, timestamp);
      return timestamp;
    } catch (error) {
      lastError = extractProviderErrorMessage(error);
    }
  }

  throw new Error(lastError || `Failed to fetch block ${blockNumber}`);
};

const normalizeAccessRequest = (value: any): AccessRequestData => ({
  requestId: Number(value.requestId ?? value[0]),
  documentId: Number(value.documentId ?? value[1]),
  requester: String(value.requester ?? value[2]),
  status: Number(value.status ?? value[3]),
  expiresAt: Number(value.expiresAt ?? value[4]),
  createdAt: Number(value.createdAt ?? value[5]),
});

const initialize = (
  providerInput: ethers.Provider,
  signerInput?: ethers.Signer
): void => {
  provider = providerInput;
  fallbackProviders = getConfiguredRpcProviders();

  const address = getContractAddress();
  readContract = new ethers.Contract(
    address,
    CONTRACT_ABI,
    fallbackProviders[0] ?? providerInput
  );
  writeContract = signerInput
    ? new ethers.Contract(address, CONTRACT_ABI, signerInput)
    : null;
};

const clear = (): void => {
  provider = null;
  fallbackProviders = [];
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
  const receipt = await waitForReceipt(tx);

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
  requiredAccess: number,
  releaseCondition = 0
): Promise<number> => {
  const contract = ensureWriteContract();
  let tx: any;

  if (
    releaseCondition !== 0 &&
    contractHasFunction(
      contract,
      "addDocumentWithReleaseCondition(uint256,string,string,uint8,uint8)"
    )
  ) {
    tx = await contract.addDocumentWithReleaseCondition(
      vaultId,
      encryptedMetadata,
      ipfsHash,
      requiredAccess,
      releaseCondition
    );
  } else if (releaseCondition === 0) {
    tx = await contract.addDocument(
      vaultId,
      encryptedMetadata,
      ipfsHash,
      requiredAccess
    );
  } else {
    throw new Error(
      "Current contract does not support release-condition policy uploads. Redeploy latest contract."
    );
  }

  const receipt = await waitForReceipt(tx);

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

const requestAccess = async (documentId: number): Promise<number> => {
  const contract = ensureWriteContract();
  const tx = await contract.requestAccess(documentId);
  const receipt = await waitForReceipt(tx);

  if (!receipt) {
    return 0;
  }

  const iface = getInterface();
  for (const log of receipt.logs ?? []) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === "AccessRequested") {
        return Number(parsed.args.requestId);
      }
    } catch {
      // ignore non-matching logs
    }
  }

  return 0;
};

const approveAccess = async (requestId: number): Promise<void> => {
  const contract = ensureWriteContract();
  const tx = await contract.approveAccess(requestId);
  await waitForReceipt(tx);
};

const acceptGuardianInvite = async (vaultId: number): Promise<void> => {
  const contract = ensureWriteContract();
  const tx = await contract.acceptGuardianInvite(vaultId);
  await waitForReceipt(tx);
};

const mintAccessToken = async (
  vaultId: number,
  to: string,
  tokenURI: string
): Promise<number> => {
  const contract = ensureWriteContract();
  const tx = await contract.mintAccessToken(vaultId, to, tokenURI);
  const receipt = await waitForReceipt(tx);

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
  await waitForReceipt(tx);
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

const hasActiveAccess = async (
  documentId: number,
  user: string
): Promise<boolean> => {
  if (!user) return false;
  await ensureContractDeployed();
  const contract = ensureReadContract();
  try {
    const allowed = await contract.hasActiveAccess(documentId, user);
    return Boolean(allowed);
  } catch {
    return false;
  }
};

const getActiveAccessMap = async (
  user: string,
  documentIds: number[]
): Promise<Record<number, boolean>> => {
  if (!user || documentIds.length === 0) {
    return {};
  }

  await ensureContractDeployed();
  const contract = ensureReadContract();

  const entries = await Promise.all(
    documentIds.map(async (documentId) => {
      try {
        const allowed = await contract.hasActiveAccess(documentId, user);
        return [documentId, Boolean(allowed)] as const;
      } catch {
        return [documentId, false] as const;
      }
    })
  );

  return Object.fromEntries(entries);
};

const getLatestRequestsForUser = async (
  user: string,
  documentIds: number[]
): Promise<Record<number, AccessRequestData | null>> => {
  if (!user || documentIds.length === 0) {
    return {};
  }

  await ensureContractDeployed();
  const contract = ensureReadContract();

  const entries = await Promise.all(
    documentIds.map(async (documentId) => {
      try {
        const requestIdRaw = await contract.latestRequestId(documentId, user);
        const requestId = Number(requestIdRaw);
        if (!requestId) {
          return [documentId, null] as const;
        }

        const requestRaw = await contract.accessRequests(requestId);
        const normalized = normalizeAccessRequest(requestRaw);
        if (!normalized.requestId) {
          return [documentId, null] as const;
        }

        return [documentId, normalized] as const;
      } catch {
        return [documentId, null] as const;
      }
    })
  );

  return Object.fromEntries(entries);
};

const getDocumentReleaseCondition = async (documentId: number): Promise<number> => {
  await ensureContractDeployed();
  const contract = ensureReadContract();

  if (!contractHasFunction(contract, "documentReleaseCondition(uint256)")) {
    return 0;
  }

  try {
    const value = await contract.documentReleaseCondition(documentId);
    return Number(value);
  } catch {
    return 0;
  }
};

const getDocumentReleaseConditionMap = async (
  documentIds: number[]
): Promise<Record<number, number>> => {
  if (documentIds.length === 0) {
    return {};
  }

  await ensureContractDeployed();
  const contract = ensureReadContract();

  if (!contractHasFunction(contract, "documentReleaseCondition(uint256)")) {
    return Object.fromEntries(documentIds.map((id) => [id, 0]));
  }

  const entries = await Promise.all(
    documentIds.map(async (documentId) => {
      try {
        const value = await contract.documentReleaseCondition(documentId);
        return [documentId, Number(value)] as const;
      } catch {
        return [documentId, 0] as const;
      }
    })
  );

  return Object.fromEntries(entries);
};

const getVaultReleaseState = async (vaultId: number): Promise<VaultReleaseState> => {
  await ensureContractDeployed();
  const contract = ensureReadContract();

  const fallback: VaultReleaseState = {
    emergencyMode: false,
    inactivityPeriod: 30 * 24 * 60 * 60,
    lastProofOfLife: 0,
    postDeathUnlocked: false,
  };

  if (!contractHasFunction(contract, "getVaultReleaseState(uint256)")) {
    return fallback;
  }

  try {
    const value = await contract.getVaultReleaseState(vaultId);
    return {
      emergencyMode: Boolean(value[0]),
      inactivityPeriod: Number(value[1]),
      lastProofOfLife: Number(value[2]),
      postDeathUnlocked: Boolean(value[3]),
    };
  } catch {
    return fallback;
  }
};

const fetchVaultReleaseStates = async (
  vaultIds: number[]
): Promise<Record<number, VaultReleaseState>> => {
  if (vaultIds.length === 0) {
    return {};
  }

  const entries = await Promise.all(
    vaultIds.map(async (vaultId) => [vaultId, await getVaultReleaseState(vaultId)] as const)
  );

  return Object.fromEntries(entries);
};

const configureVaultRelease = async (
  vaultId: number,
  inactivityPeriod: number
): Promise<void> => {
  const contract = ensureWriteContract();
  if (!contractHasFunction(contract, "configureVaultRelease(uint256,uint256)")) {
    throw new Error("Current contract does not support vault release policy configuration.");
  }
  const tx = await contract.configureVaultRelease(vaultId, inactivityPeriod);
  await waitForReceipt(tx);
};

const recordProofOfLife = async (vaultId: number): Promise<void> => {
  const contract = ensureWriteContract();
  if (!contractHasFunction(contract, "proveLife(uint256)")) {
    throw new Error("Current contract does not support proof-of-life actions.");
  }
  const tx = await contract.proveLife(vaultId);
  await waitForReceipt(tx);
};

const setEmergencyMode = async (vaultId: number, enabled: boolean): Promise<void> => {
  const contract = ensureWriteContract();
  if (!contractHasFunction(contract, "setEmergencyMode(uint256,bool)")) {
    throw new Error("Current contract does not support emergency mode controls.");
  }
  const tx = await contract.setEmergencyMode(vaultId, enabled);
  await waitForReceipt(tx);
};

const fetchPendingInvites = async (user: string): Promise<GuardianInviteData[]> => {
  if (!user) {
    return [];
  }

  await ensureContractDeployed();
  const contract = ensureReadContract();
  try {
    const invitesRaw = await contract.getPendingInvites(user);
    return (invitesRaw as any[]).map((invite) => ({
      guardian: String(invite.guardian ?? invite[0]),
      vaultId: Number(invite.vaultId ?? invite[1]),
      accepted: Boolean(invite.accepted ?? invite[2]),
      expiresAt: Number(invite.expiresAt ?? invite[3]),
    }));
  } catch {
    return [];
  }
};

const fetchPendingApprovalsForGuardian = async (
  guardian: string,
  limit = 10
): Promise<PendingApprovalData[]> => {
  if (!guardian) {
    return [];
  }

  await ensureContractDeployed();
  const contract = ensureReadContract();
  const requestLogs = await getEventLogs("AccessRequested");

  const sortedLogs = [...requestLogs].sort((a, b) => {
    if (a.log.blockNumber !== b.log.blockNumber) {
      return b.log.blockNumber - a.log.blockNumber;
    }
    return b.log.index - a.log.index;
  });

  const now = Math.floor(Date.now() / 1000);
  const guardianLower = guardian.toLowerCase();
  const seen = new Set<number>();
  const documentCache = new Map<number, any>();
  const vaultCache = new Map<number, any>();
  const pending: PendingApprovalData[] = [];

  for (const entry of sortedLogs) {
    const requestId = Number(entry.parsed.args.requestId);
    if (!requestId || seen.has(requestId)) {
      continue;
    }
    seen.add(requestId);

    try {
      const approvedByGuardian = await contract.hasApprovedRequest(requestId, guardian);
      if (approvedByGuardian) {
        continue;
      }

      const requestRaw = await contract.accessRequests(requestId);
      const request = normalizeAccessRequest(requestRaw);
      if (!request.requestId || request.status !== 0 || request.expiresAt <= now) {
        continue;
      }

      let document = documentCache.get(request.documentId);
      if (!document) {
        document = await contract.documents(request.documentId);
        documentCache.set(request.documentId, document);
      }

      const vaultId = Number(document[1]);
      let vault = vaultCache.get(vaultId);
      if (!vault) {
        vault = await contract.getVault(vaultId);
        vaultCache.set(vaultId, vault);
      }

      const guardians: string[] = vault[4] ?? [];
      const isGuardianForVault = guardians.some(
        (address) => address.toLowerCase() === guardianLower
      );

      if (!isGuardianForVault) {
        continue;
      }

      pending.push({
        requestId,
        documentId: request.documentId,
        vaultId,
        vaultName: String(vault[2] ?? `Vault #${vaultId}`),
        requester: request.requester,
        createdAt: request.createdAt,
        expiresAt: request.expiresAt,
      });

      if (pending.length >= limit) {
        break;
      }
    } catch {
      // skip malformed or unavailable request entries
    }
  }

  return pending;
};

const fetchUserTokens = async (account: string): Promise<TokenData[]> => {
  await ensureContractDeployed();
  const contract = ensureReadContract();

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
  const accountLower = account.toLowerCase();

  const tokens = await Promise.all(
    Array.from(mintedByToken.entries()).map(async ([tokenId, mintedInfo]) => {
      try {
        const owner = await contract.ownerOf(tokenId);
        if (String(owner).toLowerCase() !== accountLower) {
          return null;
        }
      } catch {
        // Token likely burned or missing
        return null;
      }

      let tokenURI = "";
      try {
        tokenURI = await contract.tokenURI(tokenId);
      } catch {
        tokenURI = "";
      }

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

  return tokens
    .filter((token): token is TokenData => token !== null)
    .sort((a, b) => b.tokenId - a.tokenId);
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
  requestAccess,
  approveAccess,
  acceptGuardianInvite,
  mintAccessToken,
  burnAccessToken,
  fetchVaults,
  fetchDocuments,
  fetchPendingInvites,
  fetchUserTokens,
  getTotalSupply,
  hasActiveAccess,
  getActiveAccessMap,
  getLatestRequestsForUser,
  getDocumentReleaseCondition,
  getDocumentReleaseConditionMap,
  getVaultReleaseState,
  fetchVaultReleaseStates,
  configureVaultRelease,
  recordProofOfLife,
  setEmergencyMode,
  fetchPendingApprovalsForGuardian,
  getRecentActivity,
};

