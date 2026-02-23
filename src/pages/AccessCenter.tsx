import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardBody,
  Input,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import {
  FiSearch,
  FiShield,
  FiKey,
  FiClock,
  FiAlertCircle,
  FiDownload,
  FiEye,
  FiUpload,
} from "react-icons/fi";
import CryptoJS from "crypto-js";
import { useWeb3 } from "../context/Web3Context";
import {
  contractService,
  AccessRequestData,
  DocumentData,
  TokenData,
  VaultData,
} from "../services/contract.service";
import { buttonClasses } from "../utils/buttonClasses";
import {
  decryptData,
  formatDate,
  getIPFSURL,
  isValidAddress,
  shortenAddress,
} from "../utils/helpers";
import { toast } from "react-hot-toast";
import { captureError } from "../services/telemetry.service";

const getKeyStorageKey = (docId: number): string => `spoovault-doc-key-${docId}`;

type WordArray = { words: number[]; sigBytes: number };
type ImportedKeyPayload = {
  documentId?: number | string;
  key?: string;
  beneficiary?: string;
  contract?: string;
  chainId?: number | string;
};

const wordArrayToUint8Array = (wordArray: WordArray): Uint8Array => {
  const { words, sigBytes } = wordArray;
  const buffer = new ArrayBuffer(sigBytes);
  const u8 = new Uint8Array(buffer);
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return u8;
};

type AccessState =
  | "ready"
  | "approved_key_missing"
  | "request_pending"
  | "request_rejected"
  | "request_expired"
  | "no_pass"
  | "can_request";

const AccessCenter = () => {
  const { account, isConnected, connect, provider, signer, isFujiNetwork } = useWeb3();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [requestingDocId, setRequestingDocId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [activeAccessByDoc, setActiveAccessByDoc] = useState<Record<number, boolean>>({});
  const [latestRequestByDoc, setLatestRequestByDoc] = useState<Record<number, AccessRequestData | null>>({});
  const keyImportInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isConnected && provider && signer && isFujiNetwork) {
      contractService.initialize(provider, signer);
      loadData();
    } else {
      setLoading(false);
    }
  }, [account, isConnected, provider, signer, isFujiNetwork]);

  const loadData = async () => {
    if (!account) {
      setVaults([]);
      setDocuments([]);
      setTokens([]);
      setActiveAccessByDoc({});
      setLatestRequestByDoc({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [vaultsData, docsData, tokenData] = await Promise.all([
        contractService.fetchVaults(),
        contractService.fetchDocuments(),
        contractService.fetchUserTokens(account),
      ]);

      const accountLower = account.toLowerCase();
      const tokenVaultIds = new Set<number>(
        tokenData
          .map((token) => token.vaultId)
          .filter((vaultId): vaultId is number => vaultId !== null)
      );

      const visibleVaults = vaultsData.filter((vault) => {
        const isCreator = vault.creator.toLowerCase() === accountLower;
        const isGuardian = vault.guardians.some(
          (guardian) => guardian.toLowerCase() === accountLower
        );
        const hasVaultPass = tokenVaultIds.has(vault.id);
        return isCreator || isGuardian || hasVaultPass;
      });

      const visibleVaultIds = new Set<number>(visibleVaults.map((vault) => vault.id));
      const scopedDocs = docsData.filter((doc) => visibleVaultIds.has(doc.vaultId));
      const docIds = scopedDocs.map((doc) => doc.id);
      const [accessMap, requestMap] = await Promise.all([
        contractService.getActiveAccessMap(account, docIds),
        contractService.getLatestRequestsForUser(account, docIds),
      ]);

      setVaults(visibleVaults);
      setDocuments(scopedDocs);
      setTokens(tokenData);
      setActiveAccessByDoc(accessMap);
      setLatestRequestByDoc(requestMap);
    } catch (error) {
      console.error("Error loading beneficiary access data:", error);
      captureError("accessCenter.loadData", error, { account: account || "" });
      const message = error instanceof Error ? error.message : "Failed to load access data";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportKeyBackup = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as ImportedKeyPayload;
      const documentId = Number(parsed.documentId);
      const key = (parsed.key || "").trim();
      const beneficiary = (parsed.beneficiary || "").trim();
      const fileContract = (parsed.contract || "").toLowerCase();
      const expectedContract = (
        (import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined) || ""
      ).toLowerCase();
      const fileChainId = Number(parsed.chainId);
      const expectedChainId = Number(import.meta.env.VITE_CHAIN_ID);

      if (!documentId || !Number.isFinite(documentId)) {
        throw new Error("Invalid key package: missing documentId");
      }
      if (!/^[a-fA-F0-9]{64}$/.test(key)) {
        throw new Error("Invalid key package: key format is not recognized");
      }
      if (beneficiary) {
        if (!isValidAddress(beneficiary)) {
          throw new Error("Invalid key package: beneficiary wallet address is invalid");
        }
        if (!account) {
          throw new Error("Connect your wallet before importing this key package");
        }
        if (beneficiary.toLowerCase() !== account.toLowerCase()) {
          throw new Error("This key package is issued for a different wallet");
        }
      }
      if (fileContract && expectedContract && fileContract !== expectedContract) {
        throw new Error("This key package is for a different SpooVault contract");
      }
      if (
        Number.isFinite(fileChainId) &&
        Number.isFinite(expectedChainId) &&
        fileChainId > 0 &&
        expectedChainId > 0 &&
        fileChainId !== expectedChainId
      ) {
        throw new Error("This key package is for a different blockchain network");
      }

      localStorage.setItem(getKeyStorageKey(documentId), key);
      toast.success(`Key imported for Document #${documentId}`);
      await loadData();
    } catch (error: any) {
      captureError("accessCenter.importKeyPackage", error);
      toast.error(error.message || "Failed to import key package");
    }
  };

  const vaultNameById = useMemo(() => {
    const map: Record<number, string> = {};
    vaults.forEach((vault) => {
      map[vault.id] = vault.name || `Vault #${vault.id}`;
    });
    return map;
  }, [vaults]);

  const vaultPassSet = useMemo(() => {
    const set = new Set<number>();
    tokens.forEach((token) => {
      if (token.vaultId !== null) {
        set.add(token.vaultId);
      }
    });
    return set;
  }, [tokens]);

  const getStoredKey = (docId: number): string | null => {
    try {
      return localStorage.getItem(getKeyStorageKey(docId));
    } catch {
      return null;
    }
  };

  const decryptMetadata = (doc: DocumentData): { name?: string; type?: string } | null => {
    const key = getStoredKey(doc.id);
    if (!key) return null;
    try {
      const raw = decryptData(doc.encryptedMetadata, key);
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const resolveAccessState = (
    hasChainAccess: boolean,
    hasLocalKey: boolean,
    hasVaultPass: boolean,
    latestRequest: AccessRequestData | null
  ): AccessState => {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const isPending =
      !!latestRequest &&
      latestRequest.status === 0 &&
      latestRequest.expiresAt > nowInSeconds;

    if (hasChainAccess && hasLocalKey) return "ready";
    if (hasChainAccess && !hasLocalKey) return "approved_key_missing";
    if (isPending) return "request_pending";
    if (latestRequest?.status === 2) return "request_rejected";
    if (
      latestRequest?.status === 3 ||
      (latestRequest?.status === 0 && latestRequest.expiresAt <= nowInSeconds)
    ) {
      return "request_expired";
    }
    if (!hasVaultPass) return "no_pass";
    return "can_request";
  };

  const rows = useMemo(() => {
    return documents.map((doc) => {
      const metadata = decryptMetadata(doc);
      const hasLocalKey = !!getStoredKey(doc.id);
      const hasChainAccess = !!activeAccessByDoc[doc.id];
      const hasVaultPass = vaultPassSet.has(doc.vaultId);
      const latestRequest = latestRequestByDoc[doc.id] ?? null;
      const state = resolveAccessState(
        hasChainAccess,
        hasLocalKey,
        hasVaultPass,
        latestRequest
      );
      return {
        doc,
        name: metadata?.name || `Document #${doc.id}`,
        type: metadata?.type || "Encrypted File",
        hasLocalKey,
        hasChainAccess,
        hasVaultPass,
        latestRequest,
        state,
      };
    });
  }, [documents, activeAccessByDoc, latestRequestByDoc, vaultPassSet]);

  const filteredRows = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return rows;
    return rows.filter((item) => {
      const vaultName = vaultNameById[item.doc.vaultId] || `Vault #${item.doc.vaultId}`;
      return (
        item.name.toLowerCase().includes(term) ||
        vaultName.toLowerCase().includes(term) ||
        item.doc.ipfsHash.toLowerCase().includes(term)
      );
    });
  }, [rows, search, vaultNameById]);

  const handleRequestAccess = async (docId: number) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      await connect();
      return;
    }
    if (!isFujiNetwork) {
      toast.error("Please switch to Avalanche Fuji network");
      return;
    }

    setRequestingDocId(docId);
    try {
      const requestId = await contractService.requestAccess(docId);
      if (!requestId) {
        toast.error("Request submitted but ID was not returned");
      } else {
        toast.success(`Access request #${requestId} submitted`);
      }
      await loadData();
    } catch (error: any) {
      captureError("accessCenter.requestAccess", error, { documentId: docId });
      toast.error(error.message || "Failed to request access");
    } finally {
      setRequestingDocId(null);
    }
  };

  const decryptFileFromIPFS = async (doc: DocumentData) => {
    if (!account) {
      throw new Error("Please connect your wallet");
    }

    const hasAccess = await contractService.hasActiveAccess(doc.id, account);
    if (!hasAccess) {
      throw new Error("No active on-chain access for this document");
    }

    const key = getStoredKey(doc.id);
    if (!key) {
      throw new Error("Encryption key not found. Import a beneficiary package first.");
    }

    const response = await fetch(getIPFSURL(doc.ipfsHash));
    if (!response.ok) {
      throw new Error("Failed to download encrypted file");
    }

    const encryptedText = await response.text();
    const decryptedWordArray = CryptoJS.AES.decrypt(encryptedText, key);
    const bytes = wordArrayToUint8Array(decryptedWordArray);

    const metadata = decryptMetadata(doc);
    const name = metadata?.name || `document-${doc.id}`;
    const type = metadata?.type || "application/octet-stream";

    return { bytes, name, type };
  };

  const handleDownload = async (doc: DocumentData) => {
    try {
      const { bytes, name, type } = await decryptFileFromIPFS(doc);
      const arrayBuffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(arrayBuffer).set(bytes);
      const blob = new Blob([arrayBuffer], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      captureError("accessCenter.download", error, { documentId: doc.id });
      toast.error(error.message || "Failed to download document");
    }
  };

  const handleView = async (doc: DocumentData) => {
    try {
      const { bytes, type } = await decryptFileFromIPFS(doc);
      const arrayBuffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(arrayBuffer).set(bytes);
      const blob = new Blob([arrayBuffer], { type });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: any) {
      captureError("accessCenter.view", error, { documentId: doc.id });
      toast.error(error.message || "Failed to open document");
    }
  };

  const stateChip = (state: AccessState) => {
    if (state === "ready") return <Chip color="success" variant="flat" size="sm">Ready</Chip>;
    if (state === "approved_key_missing") return <Chip color="warning" variant="flat" size="sm">Key Needed</Chip>;
    if (state === "request_pending") return <Chip color="warning" variant="flat" size="sm">Pending</Chip>;
    if (state === "request_rejected") return <Chip color="danger" variant="flat" size="sm">Rejected</Chip>;
    if (state === "request_expired") return <Chip color="danger" variant="flat" size="sm">Expired</Chip>;
    if (state === "no_pass") return <Chip color="default" variant="flat" size="sm">No Pass</Chip>;
    return <Chip color="primary" variant="flat" size="sm">Can Request</Chip>;
  };

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div className="rounded-2xl bg-gradient-to-r from-gray-900/50 to-[#040306] border border-gray-800 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-700 to-brand-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FiShield className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Connect beneficiary wallet to request and decrypt approved documents.
          </p>
          <Button size="lg" className={buttonClasses.primaryLg} onPress={connect} startContent={<FiKey />}>
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (!isFujiNetwork) {
    return (
      <div className="space-y-8">
        <div className="rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FiAlertCircle className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Wrong Network</h1>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Please switch to Avalanche Fuji Testnet to use beneficiary access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Access</h1>
          <p className="text-gray-400">
            Beneficiary dashboard for access requests, approvals, and decryption readiness
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            ref={keyImportInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0] ?? null;
              await handleImportKeyBackup(file);
              event.target.value = "";
            }}
          />
          <Button
            className={`${buttonClasses.primaryMd} w-full sm:w-auto`}
            startContent={<FiUpload />}
            onPress={() => keyImportInputRef.current?.click()}
          >
            Import Beneficiary Package
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
          <CardBody className="p-6">
            <p className="text-gray-400 text-sm">Vault Passes</p>
            <p className="text-2xl font-bold mt-1">{tokens.length}</p>
          </CardBody>
        </Card>
        <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
          <CardBody className="p-6">
            <p className="text-gray-400 text-sm">Approved + Key Missing</p>
            <p className="text-2xl font-bold mt-1">
              {rows.filter((r) => r.state === "approved_key_missing").length}
            </p>
          </CardBody>
        </Card>
        <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
          <CardBody className="p-6">
            <p className="text-gray-400 text-sm">Ready to Open</p>
            <p className="text-2xl font-bold mt-1">{rows.filter((r) => r.state === "ready").length}</p>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by name, vault, or hash..."
          startContent={<FiSearch className="text-gray-400" />}
          value={search}
          onValueChange={setSearch}
          className="flex-1"
        />
      </div>

      <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
        <CardBody className="p-0">
          <Table aria-label="Beneficiary access table" removeWrapper>
            <TableHeader>
              <TableColumn>DOCUMENT</TableColumn>
              <TableColumn>VAULT</TableColumn>
              <TableColumn>STATE</TableColumn>
              <TableColumn>REQUEST</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent={loading ? "Loading access records..." : "No documents found"}>
              {filteredRows.map((item) => {
                const latest = item.latestRequest;
                const requestText = latest
                  ? `#${latest.requestId} • ${formatDate(latest.createdAt)}`
                  : "-";
                const canRequest = item.state === "can_request" || item.state === "request_expired" || item.state === "request_rejected";
                const canDecrypt = item.state === "ready";
                const vaultName = vaultNameById[item.doc.vaultId] || `Vault #${item.doc.vaultId}`;

                return (
                  <TableRow key={item.doc.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-400">
                          {item.type} • uploader {shortenAddress(item.doc.uploadedBy)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{vaultName}</TableCell>
                    <TableCell>{stateChip(item.state)}</TableCell>
                    <TableCell>{requestText}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          className={buttonClasses.outlineSm}
                          isDisabled={!canRequest || requestingDocId === item.doc.id}
                          isLoading={requestingDocId === item.doc.id}
                          onPress={() => handleRequestAccess(item.doc.id)}
                        >
                          {item.state === "request_pending" ? "Pending" : "Request Access"}
                        </Button>
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          isDisabled={!canDecrypt}
                          onPress={() => handleView(item.doc)}
                        >
                          <FiEye />
                        </Button>
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          isDisabled={!canDecrypt}
                          onPress={() => handleDownload(item.doc)}
                        >
                          <FiDownload />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <div className="rounded-xl border border-gray-800/80 bg-gray-900/60 p-4 text-sm text-gray-300 flex items-start gap-2">
        <FiClock className="mt-0.5 text-gray-500" />
        <div>
          <p className="font-medium text-gray-200">Flow reminder</p>
          <p className="text-gray-400">
            Beneficiary needs all three: vault pass NFT, guardian-approved request, and imported key package.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessCenter;
