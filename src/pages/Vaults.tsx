import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
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
  Textarea,
  Slider,
  Badge,
  Avatar,
  Skeleton,
} from "@heroui/react";
import {
  FiSearch,
  FiFilter,
  FiPlus,
  FiShield,
  FiUsers,
  FiFile,
  FiLock,
  FiUserPlus,
  FiCheck,
  FiX,
  FiZap,
} from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { contractService, VaultData, DocumentData } from "../services/contract.service";
import { toast } from "react-hot-toast";
import { shortenAddress, isValidAddress } from "../utils/helpers";

interface Vault extends VaultData {
  documentCount: number;
}

const Vaults = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "mine" | "pending">("all");
  const [searchParams] = useSearchParams();
  const { account, isConnected, connect, provider, signer, isFujiNetwork } = useWeb3();

  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    guardians: [] as string[],
    newGuardian: "",
    approvalThreshold: 1,
  });

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      onOpen();
    }
  }, [searchParams, onOpen]);

  useEffect(() => {
    if (isConnected && provider && signer && isFujiNetwork) {
      contractService.initialize(provider, signer);
      loadVaults();
    } else {
      setLoading(false);
    }
  }, [isConnected, provider, signer, isFujiNetwork]);

  const loadVaults = async () => {
    setLoading(true);
    try {
      const [vaultsData, docsData] = await Promise.all([
        contractService.fetchVaults(),
        contractService.fetchDocuments(),
      ]);

      const docCounts: Record<number, number> = {};
      docsData.forEach((doc: DocumentData) => {
        docCounts[doc.vaultId] = (docCounts[doc.vaultId] || 0) + 1;
      });

      const enriched = vaultsData.map((vault) => ({
        ...vault,
        documentCount: docCounts[vault.id] || 0,
      }));

      setVaults(enriched);
    } catch (error) {
      console.error("Error loading vaults:", error);
      const message = error instanceof Error ? error.message : "Failed to load vaults";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuardian = () => {
    if (!formData.newGuardian.trim()) {
      toast.error("Please enter a guardian address");
      return;
    }

    if (!isValidAddress(formData.newGuardian)) {
      toast.error("Invalid Ethereum address");
      return;
    }

    if (formData.guardians.includes(formData.newGuardian)) {
      toast.error("Guardian already added");
      return;
    }

    setFormData({
      ...formData,
      guardians: [...formData.guardians, formData.newGuardian],
      newGuardian: "",
    });

    toast.success("Guardian added");
  };

  const handleRemoveGuardian = (address: string) => {
    setFormData({
      ...formData,
      guardians: formData.guardians.filter((addr) => addr !== address),
    });
  };

  const handleCreateVault = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      await connect();
      return;
    }

    if (!isFujiNetwork) {
      toast.error("Please switch to Avalanche Fuji network");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Vault name is required");
      return;
    }

    if (formData.guardians.length === 0) {
      toast.error("At least one guardian is required");
      return;
    }

    if (formData.approvalThreshold > formData.guardians.length + 1) {
      toast.error("Approval threshold cannot exceed number of guardians");
      return;
    }

    setCreating(true);
    try {
      const allGuardians = [account!, ...formData.guardians];
      const vaultId = await contractService.createVault(
        formData.name,
        formData.description,
        allGuardians,
        formData.approvalThreshold
      );

      if (!vaultId) {
        toast.error("Vault created but ID was not returned");
      } else {
        toast.success(`Vault #${vaultId} created successfully!`);
      }

      setFormData({
        name: "",
        description: "",
        guardians: [],
        newGuardian: "",
        approvalThreshold: 1,
      });

      onClose();
      loadVaults();
    } catch (error: any) {
      toast.error(error.message || "Failed to create vault");
    } finally {
      setCreating(false);
    }
  };

  const filteredVaults = vaults
    .filter((vault) =>
      vault.name.toLowerCase().includes(search.toLowerCase()) ||
      vault.description.toLowerCase().includes(search.toLowerCase()) ||
      vault.creator.toLowerCase().includes(search.toLowerCase())
    )
    .filter((vault) => {
      if (filter === "active") return vault.isActive;
      if (filter === "pending") return !vault.isActive;
      if (filter === "mine") return vault.creator.toLowerCase() === account?.toLowerCase();
      return true;
    });

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div className="rounded-2xl bg-gradient-to-r from-gray-900/50 to-[#040306] border border-gray-800 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-700 to-brand-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FiShield className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Connect your wallet to create and manage multi-signature document vaults on Avalanche.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-brand-700 to-brand-900 font-semibold hover:shadow-xl hover:shadow-brand-800/20"
            onPress={connect}
            startContent={<FiZap />}
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
            Please switch to Avalanche Fuji Testnet to manage vaults.
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
          <h1 className="text-3xl font-bold mb-2">Your Vaults</h1>
          <p className="text-gray-400">
            Secure multi-signature document vaults on Avalanche.
          </p>
        </div>
        <Button
          className="bg-gradient-to-r from-brand-700 to-brand-900 font-semibold hover:shadow-xl hover:shadow-brand-800/20 transition-all group"
          startContent={<FiPlus className="group-hover:rotate-90 transition-transform" />}
          onPress={onOpen}
        >
          Create Vault
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search vaults by name, description, or creator..."
          startContent={<FiSearch className="text-gray-400" />}
          value={search}
          onValueChange={setSearch}
          className="max-w-lg"
        />
        <Dropdown>
          <DropdownTrigger>
            <Button variant="flat" startContent={<FiFilter />}>
              Filter
            </Button>
          </DropdownTrigger>
          <DropdownMenu onAction={(key) => setFilter(key as typeof filter)}>
            <DropdownItem key="all">All Vaults</DropdownItem>
            <DropdownItem key="active">Active</DropdownItem>
            <DropdownItem key="mine">My Vaults</DropdownItem>
            <DropdownItem key="pending">Pending</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border border-gray-800 bg-gray-900/30">
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="rounded-lg">
                    <div className="w-12 h-12 rounded-lg bg-default-300" />
                  </Skeleton>
                  <div className="space-y-2">
                    <Skeleton className="rounded-lg">
                      <div className="h-4 w-24 rounded-lg bg-default-300" />
                    </Skeleton>
                    <Skeleton className="rounded-lg">
                      <div className="h-3 w-16 rounded-lg bg-default-300" />
                    </Skeleton>
                  </div>
                </div>
                <Skeleton className="rounded-lg w-full mb-4">
                  <div className="h-3 w-full rounded-lg bg-default-300" />
                </Skeleton>
                <Skeleton className="rounded-lg w-3/4 mb-2">
                  <div className="h-3 rounded-lg bg-default-300" />
                </Skeleton>
                <Skeleton className="rounded-lg w-1/2">
                  <div className="h-3 rounded-lg bg-default-300" />
                </Skeleton>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : filteredVaults.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FiShield className="text-gray-600 text-3xl" />
          </div>
          <h3 className="text-xl font-bold mb-2">No vaults found</h3>
          <p className="text-gray-400 mb-6">
            {search ? "Try a different search term" : "Create your first vault to get started"}
          </p>
          <Button
            className="bg-gradient-to-r from-brand-700 to-brand-900"
            onPress={onOpen}
            startContent={<FiPlus />}
          >
            Create Your First Vault
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVaults.map((vault) => (
            <Card
              key={vault.id}
              className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm hover:border-brand-700/30 transition-all duration-300 group"
            >
              <CardHeader className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-700 to-brand-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FiShield className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{vault.name}</h3>
                    <Chip
                      color={vault.isActive ? "success" : "warning"}
                      variant="flat"
                      size="sm"
                    >
                      {vault.isActive ? "ACTIVE" : "PENDING"}
                    </Chip>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-gray-400 text-sm mb-4">{vault.description}</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <FiUsers />
                      <span>Guardians</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge color="primary" variant="flat" size="sm">
                        {vault.guardians.length}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <FiFile />
                      <span>Documents</span>
                    </div>
                    <span className="font-medium">{vault.documentCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <FiLock />
                      <span>Approval</span>
                    </div>
                    <span className="font-medium">{vault.approvalThreshold}/{vault.guardians.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Creator</span>
                    <span className="font-mono text-xs">{shortenAddress(vault.creator)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Vault ID</span>
                    <span className="font-medium">#{vault.id}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        className="bg-gray-900"
        scrollBehavior="inside"
        placement="center"
      >
        <ModalContent className="bg-gray-900 w-[92vw] max-w-2xl max-h-[85vh] overflow-hidden">
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-700 to-brand-900 rounded-xl flex items-center justify-center">
                <FiShield className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Create New Vault</h2>
                <p className="text-sm text-gray-400">Multi-signature document security</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="max-h-[70vh] overflow-y-auto">
            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Vault Details</p>
                    <p className="text-xs text-gray-400">Name and describe the vault</p>
                  </div>
                  <Chip size="sm" variant="flat" className="bg-brand-700/10 text-brand-500">
                    Step 1
                  </Chip>
                </div>
                <div className="space-y-3">
                  <Input
                    label="Vault Name"
                    placeholder="e.g., Legal Contracts, Financial Reports"
                    value={formData.name}
                    onValueChange={(value) => setFormData({ ...formData, name: value })}
                    isRequired
                    classNames={{
                      input: "bg-gray-800/50 border-gray-700",
                    }}
                  />
                  <Textarea
                    label="Description"
                    placeholder="Describe what documents will be stored in this vault..."
                    value={formData.description}
                    onValueChange={(value) => setFormData({ ...formData, description: value })}
                    minRows={3}
                    classNames={{
                      input: "bg-gray-800/50 border-gray-700",
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Guardians</p>
                    <p className="text-xs text-gray-400">Add approvers for multi-signature access</p>
                  </div>
                  <Chip size="sm" variant="flat" className="bg-brand-700/10 text-brand-500">
                    Step 2
                  </Chip>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter guardian's Ethereum address"
                    value={formData.newGuardian}
                    onValueChange={(value) => setFormData({ ...formData, newGuardian: value })}
                    className="flex-1"
                    classNames={{
                      input: "bg-gray-800/50 border-gray-700",
                    }}
                  />
                  <Button
                    className="bg-gradient-to-r from-brand-700 to-brand-900"
                    startContent={<FiUserPlus />}
                    onPress={handleAddGuardian}
                    isDisabled={!formData.newGuardian.trim()}
                  >
                    Add
                  </Button>
                </div>

                {formData.guardians.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Guardians ({formData.guardians.length})</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {formData.guardians.map((address, index) => (
                        <div
                          key={address}
                          className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              className="w-8 h-8 bg-gray-700"
                              name={(index + 1).toString()}
                            />
                            <div>
                              <p className="font-mono text-sm">{shortenAddress(address, 6)}</p>
                              <p className="text-xs text-gray-400">Guardian #{index + 1}</p>
                            </div>
                          </div>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => handleRemoveGuardian(address)}
                          >
                            <FiX className="text-gray-400" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-gray-800/40 border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiCheck className="text-brand-500" />
                    <div>
                      <p className="text-sm font-medium">You will be the first guardian</p>
                      <p className="text-xs text-gray-400">Creators are automatically added</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Approval Threshold</p>
                    <p className="text-xs text-gray-400">Required approvals for access</p>
                  </div>
                  <Chip size="sm" variant="flat" className="bg-brand-700/10 text-brand-500">
                    Step 3
                  </Chip>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">Current</span>
                    <span className="font-semibold">
                      {formData.approvalThreshold} of {formData.guardians.length + 1}
                    </span>
                  </div>
                  <Slider
                    value={formData.approvalThreshold}
                    onChange={(value) => {
                      const nextValue = Array.isArray(value) ? value[0] : value;
                      setFormData({ ...formData, approvalThreshold: nextValue });
                    }}
                    minValue={1}
                    maxValue={formData.guardians.length + 1}
                    step={1}
                    className="max-w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Less Secure</span>
                    <span>More Secure</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-brand-700/10 border border-brand-700/20 rounded-2xl">
                <p className="text-sm">
                  <span className="font-medium">Note:</span> Creating a vault requires a blockchain
                  transaction and will incur gas fees on Avalanche Fuji.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose} isDisabled={creating}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-brand-700 to-brand-900 font-semibold"
              onPress={handleCreateVault}
              isLoading={creating}
              isDisabled={!formData.name || formData.guardians.length === 0}
            >
              {creating ? "Creating..." : "Create Vault"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Vaults;

