import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  Input,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import {
  FiSearch,
  FiFilter,
  FiUpload,
  FiFile,
  FiDownload,
  FiEye,
  FiMoreVertical,
  FiShield,
  FiCalendar,
  FiUser,
  FiKey,
} from "react-icons/fi";
import CryptoJS from "crypto-js";
import { useWeb3 } from "../context/Web3Context";
import {
  contractService,
  VaultData,
  DocumentData,
} from "../services/contract.service";
import {
  decryptData,
  encryptData,
  generateEncryptionKey,
  getIPFSURL,
  isIPFSConfigured,
  shortenAddress,
  uploadToIPFS,
  formatDate,
  formatFileSize,
} from "../utils/helpers";
import { toast } from "react-hot-toast";

const getKeyStorageKey = (docId: number): string => `spoovault-doc-key-${docId}`;

type WordArray = { words: number[]; sigBytes: number };

const wordArrayToUint8Array = (wordArray: WordArray): Uint8Array => {
  const { words, sigBytes } = wordArray;
  const buffer = new ArrayBuffer(sigBytes);
  const u8 = new Uint8Array(buffer);
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return u8;
};

const encryptFile = async (file: File, key: string): Promise<File> => {
  const arrayBuffer = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);
  const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();
  return new File([encrypted], `${file.name}.enc`, { type: "text/plain" });
};

const Documents = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "accessible" | "encrypted">("all");
  const { isConnected, connect, provider, signer, isFujiNetwork } = useWeb3();

  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [selectedVaultId, setSelectedVaultId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [accessLevel, setAccessLevel] = useState<number>(0);

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [lastDocumentId, setLastDocumentId] = useState<number | null>(null);

  useEffect(() => {
    if (isConnected && provider && signer && isFujiNetwork) {
      contractService.initialize(provider, signer);
      loadData();
    } else {
      setLoading(false);
    }
  }, [isConnected, provider, signer, isFujiNetwork]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vaultsData, docsData] = await Promise.all([
        contractService.fetchVaults(),
        contractService.fetchDocuments(),
      ]);
      setVaults(vaultsData);
      setDocuments(docsData);
    } catch (error) {
      console.error("Error loading documents:", error);
      const message = error instanceof Error ? error.message : "Failed to load documents";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const vaultNameById = useMemo(() => {
    const map: Record<number, string> = {};
    vaults.forEach((vault) => {
      map[vault.id] = vault.name || `Vault #${vault.id}`;
    });
    return map;
  }, [vaults]);

  const getStoredKey = (docId: number): string | null => {
    try {
      return localStorage.getItem(getKeyStorageKey(docId));
    } catch {
      return null;
    }
  };

  const decryptMetadata = (doc: DocumentData): { name?: string; size?: number; type?: string } | null => {
    const key = getStoredKey(doc.id);
    if (!key) return null;
    try {
      const raw = decryptData(doc.encryptedMetadata, key);
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const documentsWithMetadata = useMemo(() => {
    return documents.map((doc) => {
      const metadata = decryptMetadata(doc);
      return {
        doc,
        metadata,
        name: metadata?.name || `Document #${doc.id}`,
        vaultName: vaultNameById[doc.vaultId] || `Vault #${doc.vaultId}`,
        hasKey: !!metadata,
      };
    });
  }, [documents, vaultNameById]);

  const filteredDocuments = documentsWithMetadata
    .filter((item) => {
      const term = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(term) ||
        item.vaultName.toLowerCase().includes(term) ||
        item.doc.ipfsHash.toLowerCase().includes(term) ||
        item.doc.uploadedBy.toLowerCase().includes(term)
      );
    })
    .filter((item) => {
      if (filter === "accessible") return item.hasKey;
      if (filter === "encrypted") return !item.hasKey;
      return true;
    });

  const accessLabel = (level: number) => {
    if (level === 2) return "admin";
    if (level === 1) return "read_write";
    return "read";
  };

  const handleUpload = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      await connect();
      return;
    }

    if (!isFujiNetwork) {
      toast.error("Please switch to Avalanche Fuji network");
      return;
    }

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!selectedVaultId) {
      toast.error("Please select a vault");
      return;
    }

    if (!isIPFSConfigured()) {
      toast.error("IPFS is not configured");
      return;
    }

    setUploading(true);
    try {
      const key = generateEncryptionKey();
      const metadata = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        lastModified: selectedFile.lastModified,
      };
      const encryptedMetadata = encryptData(JSON.stringify(metadata), key);
      const encryptedFile = await encryptFile(selectedFile, key);
      const ipfsResult = await uploadToIPFS(encryptedFile, { name: selectedFile.name });

      const documentId = await contractService.addDocument(
        selectedVaultId,
        encryptedMetadata,
        ipfsResult.hash,
        accessLevel
      );

      if (!documentId) {
        toast.error("Document uploaded but ID was not returned");
      } else {
        localStorage.setItem(getKeyStorageKey(documentId), key);
        setLastKey(key);
        setLastDocumentId(documentId);
        setShowKeyModal(true);
        toast.success("Document uploaded successfully");
      }

      setSelectedFile(null);
      setSelectedVaultId(null);
      setAccessLevel(0);
      onClose();
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const decryptFileFromIPFS = async (doc: DocumentData) => {
    const key = getStoredKey(doc.id);
    if (!key) {
      throw new Error("Encryption key not found for this document");
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
      toast.error(error.message || "Failed to open document");
    }
  };

  const accessibleCount = documentsWithMetadata.filter((item) => item.hasKey).length;

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div className="rounded-2xl bg-gradient-to-r from-gray-900/50 to-[#040306] border border-gray-800 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-700 to-brand-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FiShield className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Connect your wallet to upload and manage encrypted documents on Avalanche.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-brand-700 to-brand-900 font-semibold hover:shadow-xl hover:shadow-brand-800/20"
            onPress={connect}
            startContent={<FiUpload />}
          >
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
            <FiShield className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Wrong Network</h1>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Please switch to Avalanche Fuji Testnet to manage documents.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 font-semibold"
            onPress={() => window.ethereum && window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0xA869" }]
            })}
          >
            Switch to Fuji Network
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Documents</h1>
          <p className="text-gray-400">
            Manage encrypted documents across all vaults
          </p>
        </div>
        <Button
          className="bg-gradient-to-r from-brand-700 to-brand-900 font-semibold hover-glow"
          startContent={<FiUpload />}
          onPress={onOpen}
        >
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Documents</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20">
                <FiFile className="text-blue-400 text-xl" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Accessible</p>
                <p className="text-2xl font-bold">{accessibleCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <FiKey className="text-green-400 text-xl" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Vaults</p>
                <p className="text-2xl font-bold">{vaults.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/20">
                <FiShield className="text-purple-400 text-xl" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search documents..."
          startContent={<FiSearch className="text-gray-400" />}
          value={search}
          onValueChange={setSearch}
          className="flex-1"
        />
        <Dropdown>
          <DropdownTrigger>
            <Button variant="flat" startContent={<FiFilter />}>
              Filter
            </Button>
          </DropdownTrigger>
          <DropdownMenu onAction={(key) => setFilter(key as typeof filter)}>
            <DropdownItem key="all">All Documents</DropdownItem>
            <DropdownItem key="accessible">Accessible</DropdownItem>
            <DropdownItem key="encrypted">Encrypted</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
        <CardBody className="p-0">
          <Table aria-label="Documents table" removeWrapper>
            <TableHeader>
              <TableColumn>DOCUMENT</TableColumn>
              <TableColumn>VAULT</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACCESS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={loading ? "Loading documents..." : "No documents found"}
            >
              {filteredDocuments.map((item) => (
                <TableRow key={item.doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                        <FiFile className="text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <FiUser />
                          <span>{shortenAddress(item.doc.uploadedBy)}</span>
                          <FiCalendar />
                          <span>{formatDate(item.doc.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FiShield className="text-gray-400" />
                      <span>{item.vaultName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.hasKey ? (
                      <Chip color="success" variant="flat" size="sm">
                        Accessible
                      </Chip>
                    ) : (
                      <Chip color="warning" variant="flat" size="sm">
                        Encrypted
                      </Chip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={
                        item.doc.requiredAccess === 2
                          ? "danger"
                          : item.doc.requiredAccess === 1
                          ? "warning"
                          : "success"
                      }
                      variant="flat"
                      size="sm"
                    >
                      {accessLabel(item.doc.requiredAccess)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        isDisabled={!item.hasKey}
                        onPress={() => handleView(item.doc)}
                      >
                        <FiEye />
                      </Button>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        isDisabled={!item.hasKey}
                        onPress={() => handleDownload(item.doc)}
                      >
                        <FiDownload />
                      </Button>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly variant="light" size="sm">
                            <FiMoreVertical />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          onAction={(key) => {
                            if (key === "copy") {
                              navigator.clipboard.writeText(item.doc.ipfsHash);
                              toast.success("IPFS hash copied");
                            }
                          }}
                        >
                          <DropdownItem key="copy">Copy IPFS Hash</DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        className="bg-gray-900"
        scrollBehavior="inside"
        placement="center"
      >
        <ModalContent className="bg-gray-900 w-[92vw] max-w-2xl max-h-[85vh] overflow-hidden">
          <ModalHeader className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-700 to-brand-900 rounded-xl flex items-center justify-center">
              <FiUpload className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Upload Document</h2>
              <p className="text-sm text-gray-400">Encrypt locally, then pin to IPFS</p>
            </div>
          </ModalHeader>
          <ModalBody className="max-h-[70vh] overflow-y-auto">
            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">File</p>
                    <p className="text-xs text-gray-400">Select the document to encrypt</p>
                  </div>
                  <Chip size="sm" variant="flat" className="bg-brand-700/10 text-brand-500">
                    Step 1
                  </Chip>
                </div>
                <Input
                  type="file"
                  label="Select File"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                />
                {selectedFile && (
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{selectedFile.name}</span>
                    <span>{formatFileSize(selectedFile.size)}</span>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Vault</p>
                    <p className="text-xs text-gray-400">Choose where to store this file</p>
                  </div>
                  <Chip size="sm" variant="flat" className="bg-brand-700/10 text-brand-500">
                    Step 2
                  </Chip>
                </div>
                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="flat" className="w-full justify-between">
                      {selectedVaultId
                        ? vaultNameById[selectedVaultId] || `Vault #${selectedVaultId}`
                        : "Select Vault"}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu onAction={(key) => setSelectedVaultId(Number(key))}>
                    {vaults.map((vault) => (
                      <DropdownItem key={vault.id}>{vault.name || `Vault #${vault.id}`}</DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
                {vaults.length === 0 && (
                  <p className="text-sm text-yellow-400">
                    You need to create a vault before uploading documents.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Access Level</p>
                    <p className="text-xs text-gray-400">Required access for this document</p>
                  </div>
                  <Chip size="sm" variant="flat" className="bg-brand-700/10 text-brand-500">
                    Step 3
                  </Chip>
                </div>
                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="flat" className="w-full justify-between">
                      {accessLabel(accessLevel)} access
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu onAction={(key) => setAccessLevel(Number(key))}>
                    <DropdownItem key={0}>read</DropdownItem>
                    <DropdownItem key={1}>read_write</DropdownItem>
                    <DropdownItem key={2}>admin</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>

              <div className="p-4 bg-brand-700/10 border border-brand-700/20 rounded-2xl">
                <p className="text-sm">
                  <span className="font-medium">Note:</span> Files are encrypted client-side before
                  upload. Save the encryption key shown after upload.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose} isDisabled={uploading}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-brand-700 to-brand-900 font-semibold"
              onPress={handleUpload}
              isLoading={uploading}
              isDisabled={vaults.length === 0 || !selectedFile || !selectedVaultId || uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        size="md"
        className="bg-gray-900"
        scrollBehavior="inside"
        placement="center"
      >
        <ModalContent className="bg-gray-900 w-[92vw] max-w-lg max-h-[80vh] overflow-hidden">
          <ModalHeader>Encryption Key</ModalHeader>
          <ModalBody className="max-h-[70vh] overflow-y-auto">
            <p className="text-gray-400 text-sm">
              Save this key securely. You will need it to decrypt Document #{lastDocumentId}.
            </p>
            <div className="p-3 bg-gray-800/60 rounded-lg font-mono text-sm break-all">
              {lastKey}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowKeyModal(false)}>
              Close
            </Button>
            <Button
              className="bg-gradient-to-r from-brand-700 to-brand-900"
              onPress={() => {
                if (lastKey) {
                  navigator.clipboard.writeText(lastKey);
                  toast.success("Key copied to clipboard");
                }
              }}
            >
              Copy Key
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Documents;

