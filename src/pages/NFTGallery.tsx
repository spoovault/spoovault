import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
} from "@heroui/react";
import {
  FiKey,
  FiPlus,
  FiChevronDown,
  FiEye,
  FiTrash,
  FiShield,
} from "react-icons/fi";
import { useWeb3 } from "../context/Web3Context";
import {
  contractService,
  TokenData,
  VaultData,
} from "../services/contract.service";
import { toast } from "react-hot-toast";
import { formatDate, isValidAddress, shortenAddress } from "../utils/helpers";
import { buttonClasses } from "../utils/buttonClasses";

const NFTGallery = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { account, isConnected, connect, provider, signer, isFujiNetwork } = useWeb3();

  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [burningTokenId, setBurningTokenId] = useState<number | null>(null);
  const [totalSupply, setTotalSupply] = useState(0);

  const [form, setForm] = useState({
    vaultId: "",
    recipient: "",
    tokenURI: "",
  });
  const modalInputClassNames = {
    inputWrapper: "bg-gray-900/75 border border-gray-700/80 shadow-none data-[hover=true]:border-gray-600",
    input: "text-sm text-gray-100",
  };
  const modalSelectClassName =
    "h-11 w-full rounded-full border border-gray-700/80 bg-gray-900/75 px-4 pr-10 text-sm text-gray-100 outline-none transition-colors hover:border-gray-600 focus:border-brand-700/70";

  useEffect(() => {
    if (isConnected && provider && signer && isFujiNetwork) {
      contractService.initialize(provider, signer);
      loadTokens();
    } else {
      setLoading(false);
    }
  }, [isConnected, provider, signer, isFujiNetwork]);

  const loadTokens = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const [tokenData, vaultData, supply] = await Promise.all([
        contractService.fetchUserTokens(account),
        contractService.fetchVaults(),
        contractService.getTotalSupply(),
      ]);
      setTokens(tokenData);
      setVaults(vaultData);
      setTotalSupply(supply);
    } catch (error) {
      console.error("Error loading tokens:", error);
      const message = error instanceof Error ? error.message : "Failed to load tokens";
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

  const handleMint = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      await connect();
      return;
    }

    if (!isFujiNetwork) {
      toast.error("Please switch to Avalanche Fuji network");
      return;
    }

    const vaultId = Number(form.vaultId);
    if (!vaultId) {
      toast.error("Vault ID is required");
      return;
    }

    if (!isValidAddress(form.recipient)) {
      toast.error("Invalid recipient address");
      return;
    }

    setMinting(true);
    try {
      const tokenId = await contractService.mintAccessToken(
        vaultId,
        form.recipient,
        form.tokenURI || ""
      );

      if (!tokenId) {
        toast.error("Token minted but ID was not returned");
      } else {
        toast.success(`Token #${tokenId} minted`);
      }

      setForm({ vaultId: "", recipient: "", tokenURI: "" });
      onClose();
      loadTokens();
    } catch (error: any) {
      toast.error(error.message || "Failed to mint token");
    } finally {
      setMinting(false);
    }
  };

  const handleBurn = async (tokenId: number) => {
    setBurningTokenId(tokenId);
    try {
      await contractService.burnAccessToken(tokenId);
      toast.success(`Token #${tokenId} burned`);
      loadTokens();
    } catch (error: any) {
      toast.error(error.message || "Failed to burn token");
    } finally {
      setBurningTokenId(null);
    }
  };

  const ownedVaultCount = useMemo(() => {
    const vaultIds = new Set<number>();
    tokens.forEach((token) => {
      if (token.vaultId !== null) {
        vaultIds.add(token.vaultId);
      }
    });
    return vaultIds.size;
  }, [tokens]);

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div className="rounded-2xl bg-gradient-to-r from-gray-900/50 to-[#040306] border border-gray-800 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-700 to-brand-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FiKey className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Connect your wallet to view and manage vault access passes.
          </p>
          <Button
            size="lg"
            className={buttonClasses.primaryLg}
            onPress={connect}
            startContent={<FiKey />}
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
            Please switch to Avalanche Fuji Testnet to manage access passes.
          </p>
          <Button
            size="lg"
            className={buttonClasses.warningLg}
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
          <h1 className="text-3xl font-bold mb-2">Access Passes</h1>
          <p className="text-gray-400">
            Manage ERC-721 passes for vault permissions and controlled release
          </p>
        </div>
        <Button
          className={buttonClasses.primaryMd}
          startContent={<FiPlus />}
          onPress={onOpen}
        >
          Mint Pass
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Issued Passes</p>
                <p className="text-2xl font-bold">{tokens.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/20">
                <FiKey className="text-purple-400 text-xl" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pass Supply</p>
                <p className="text-2xl font-bold">{totalSupply}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <FiShield className="text-green-400 text-xl" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Access Vaults</p>
                <p className="text-2xl font-bold">{ownedVaultCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-brand-700/20">
                <FiShield className="text-brand-400 text-xl" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="text-gray-400">Loading passes...</div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-12 col-span-full">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FiKey className="text-gray-600 text-3xl" />
            </div>
            <h3 className="text-xl font-bold mb-2">No passes found</h3>
            <p className="text-gray-400 mb-6">
              Mint your first access pass to define who can request or receive protected files.
            </p>
            <Button
              className={buttonClasses.primaryMd}
              onPress={onOpen}
              startContent={<FiPlus />}
            >
              Mint Pass
            </Button>
          </div>
        ) : (
          tokens.map((token) => (
            <Card
              key={token.tokenId}
              className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm hover:border-brand-700/30 transition-colors"
            >
              <CardBody className="p-0">
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <FiKey className="text-gray-600 text-4xl" />
                  </div>
                  <div className="absolute top-3 right-3">
                    <Chip color="success" variant="flat" size="sm">
                      active
                    </Chip>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-lg mb-3">Access Pass #{token.tokenId}</h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Vault</span>
                      <span className="font-medium">
                        {token.vaultId !== null
                          ? vaultNameById[token.vaultId] || `Vault #${token.vaultId}`
                          : "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Owner</span>
                      <span className="font-mono text-xs">{shortenAddress(token.owner)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Issued</span>
                      <span>{token.mintedAt ? formatDate(token.mintedAt) : "-"}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      fullWidth
                      variant="flat"
                      startContent={<FiEye />}
                      onPress={() => {
                        if (token.tokenURI) {
                          window.open(token.tokenURI, "_blank");
                        } else {
                          toast.error("No token URI set");
                        }
                      }}
                    >
                      View
                    </Button>
                    <Button
                      fullWidth
                      color="danger"
                      variant="flat"
                      startContent={<FiTrash />}
                      isLoading={burningTokenId === token.tokenId}
                      onPress={() => handleBurn(token.tokenId)}
                    >
                      Burn
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        backdrop="blur"
        classNames={{
          wrapper: "z-[120]",
          backdrop: "bg-black/70",
        }}
        scrollBehavior="inside"
        placement="center"
      >
        <ModalContent className="bg-gray-950 w-[94vw] max-w-xl max-h-[82vh] overflow-hidden border border-gray-800/90 shadow-2xl">
          <ModalHeader className="border-b border-gray-800/80 px-4 sm:px-6 py-4">Mint Access Pass</ModalHeader>
          <ModalBody className="modal-scroll max-h-[70vh] overflow-y-auto px-4 sm:px-6 py-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-300 font-medium">Vault ID</p>
                <Input
                  placeholder="Enter vault ID"
                  value={form.vaultId}
                  onValueChange={(value) => setForm({ ...form, vaultId: value })}
                  classNames={modalInputClassNames}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-300 font-medium">Recipient Address</p>
                <Input
                  placeholder="0x..."
                  value={form.recipient}
                  onValueChange={(value) => setForm({ ...form, recipient: value })}
                  classNames={modalInputClassNames}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-300 font-medium">Token URI (optional)</p>
                <Input
                  placeholder="https://..."
                  value={form.tokenURI}
                  onValueChange={(value) => setForm({ ...form, tokenURI: value })}
                  classNames={modalInputClassNames}
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-300 font-medium">Select Vault</p>
                <div className="relative">
                  <select
                    value={form.vaultId}
                    onChange={(event) => setForm({ ...form, vaultId: event.target.value })}
                    className={modalSelectClassName}
                  >
                    <option value="">Select Vault</option>
                    {vaults.map((vault) => (
                      <option key={vault.id} value={vault.id}>
                        {vault.name || `Vault #${vault.id}`}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>

              <div className="p-4 bg-brand-700/10 border border-brand-700/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Note:</span> Only vault guardians can mint access passes.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-800/80 px-4 sm:px-6 py-3 flex-col-reverse sm:flex-row gap-2">
            <Button className={`${buttonClasses.ghostMd} w-full sm:w-auto`} onPress={onClose} isDisabled={minting}>
              Cancel
            </Button>
            <Button
              className={`${buttonClasses.primaryMd} w-full sm:w-auto`}
              onPress={handleMint}
              isLoading={minting}
            >
              Mint Pass
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default NFTGallery;

