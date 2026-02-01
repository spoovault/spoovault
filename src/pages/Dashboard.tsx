import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Progress,
  Skeleton,
  Chip,
} from "@heroui/react";
import {
  FiShield,
  FiFile,
  FiUsers,
  FiKey,
  FiActivity,
  FiTrendingUp,
  FiPlus,
  FiArrowUpRight,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import {
  contractService,
  VaultData,
  DocumentData,
  ActivityEvent,
} from "../services/contract.service";
import { toast } from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const { account, isConnected, connect, provider, signer, isFujiNetwork } = useWeb3();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [stats, setStats] = useState({
    totalVaults: 0,
    totalDocuments: 0,
    totalGuardians: 0,
    totalNFTs: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    if (isConnected && provider && isFujiNetwork) {
      contractService.initialize(provider, signer ?? undefined);
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [isConnected, provider, signer, isFujiNetwork]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [vaultsData, docsData, totalNFTs, activity] = await Promise.all([
        contractService.fetchVaults(),
        contractService.fetchDocuments(),
        contractService.getTotalSupply(),
        contractService.getRecentActivity(5),
      ]);

      const guardianSet = new Set<string>();
      vaultsData.forEach((vault) => {
        vault.guardians.forEach((guardian) => {
          guardianSet.add(guardian.toLowerCase());
        });
      });

      setVaults(vaultsData);
      setDocuments(docsData);
      setRecentActivity(activity);
      setStats({
        totalVaults: vaultsData.length,
        totalDocuments: docsData.length,
        totalGuardians: guardianSet.size,
        totalNFTs,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      const message = error instanceof Error ? error.message : "Failed to load dashboard data";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVault = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      connect();
      return;
    }
    if (!isFujiNetwork) {
      toast.error("Please switch to Avalanche Fuji network");
      return;
    }
    navigate("/vaults?create=true");
  };

  const docCountByVault = useMemo(() => {
    const counts: Record<number, number> = {};
    documents.forEach((doc) => {
      counts[doc.vaultId] = (counts[doc.vaultId] || 0) + 1;
    });
    return counts;
  }, [documents]);

  const maxDocCount = useMemo(() => {
    const values = Object.values(docCountByVault);
    return values.length > 0 ? Math.max(...values) : 0;
  }, [docCountByVault]);

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div className="rounded-2xl bg-gradient-to-r from-gray-900/50 to-[#040306] border border-gray-800 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-700 to-brand-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FiShield className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Welcome to SpooVault</h1>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Connect your wallet to manage real vaults and documents on Avalanche Fuji.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-brand-700 to-brand-900 font-semibold hover:shadow-xl hover:shadow-brand-800/20"
              onPress={connect}
              startContent={<FiKey />}
            >
              Connect Wallet
            </Button>
            <Button
              size="lg"
              variant="flat"
              className="border border-gray-700"
              onPress={() => navigate("/")}
            >
              Learn More
            </Button>
          </div>
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
            Please switch to Avalanche Fuji Testnet to use SpooVault.
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
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-gray-900/50 to-[#040306] border border-gray-800 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-700 to-brand-900 rounded-xl flex items-center justify-center">
                <FiShield className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Welcome back</h1>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Connected to {account?.slice(0, 6)}...{account?.slice(-4)}</span>
                </div>
              </div>
            </div>
            <p className="text-gray-400">
              Your on-chain vaults are ready. Create a new vault to get started.
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-brand-700 to-brand-900 font-semibold hover:shadow-xl hover:shadow-brand-800/20 transition-all"
            onPress={handleCreateVault}
            startContent={<FiPlus />}
            size="lg"
          >
            Create Vault
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border border-gray-800 bg-gray-900/30">
                <CardBody className="p-6">
                  <Skeleton className="rounded-lg">
                    <div className="h-24 rounded-lg bg-default-300" />
                  </Skeleton>
                </CardBody>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900">
                    <FiShield className="text-white text-xl" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1">{stats.totalVaults}</h3>
                <p className="text-gray-400 text-sm">Active Vaults</p>
              </CardBody>
            </Card>

            <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                    <FiFile className="text-white text-xl" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1">{stats.totalDocuments}</h3>
                <p className="text-gray-400 text-sm">Documents</p>
              </CardBody>
            </Card>

            <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                    <FiUsers className="text-white text-xl" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1">{stats.totalGuardians}</h3>
                <p className="text-gray-400 text-sm">Guardians</p>
              </CardBody>
            </Card>

            <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500">
                    <FiKey className="text-white text-xl" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1">{stats.totalNFTs}</h3>
                <p className="text-gray-400 text-sm">NFT Tokens</p>
              </CardBody>
            </Card>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiActivity />
              <h2 className="text-xl font-semibold">Recent Activity</h2>
            </div>
            <Button variant="light" size="sm" onPress={() => navigate("/vaults")}>View Vaults</Button>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="rounded-lg">
                    <div className="h-16 rounded-lg bg-default-300" />
                  </Skeleton>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                No recent activity yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-4 hover:bg-gray-800/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          activity.status === "success"
                            ? "bg-green-500/20"
                            : "bg-yellow-500/20"
                        }`}>
                          {activity.status === "success" ? (
                            <FiCheckCircle className="text-green-400" />
                          ) : (
                            <FiClock className="text-yellow-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-gray-400">{activity.actor}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {activity.timestamp
                            ? formatDistanceToNow(new Date(activity.timestamp * 1000), { addSuffix: true })
                            : "-"}
                        </p>
                        <Chip
                          color={activity.status === "success" ? "success" : "warning"}
                          variant="flat"
                          size="sm"
                          className="mt-1"
                        >
                          {activity.status}
                        </Chip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
          <CardHeader>
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <Link to="/vaults">
              <Button fullWidth variant="flat" className="justify-start h-12">
                <FiShield className="mr-3" />
                Create Vault
              </Button>
            </Link>
            <Link to="/documents">
              <Button fullWidth variant="flat" className="justify-start h-12">
                <FiFile className="mr-3" />
                Upload Document
              </Button>
            </Link>
            <Link to="/nfts">
              <Button fullWidth variant="flat" className="justify-start h-12">
                <FiKey className="mr-3" />
                Mint NFT
              </Button>
            </Link>
            <Link to="/vaults">
              <Button fullWidth variant="flat" className="justify-start h-12">
                <FiUsers className="mr-3" />
                Add Guardian
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>

      <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiTrendingUp />
            <h2 className="text-xl font-semibold">Vault Activity</h2>
          </div>
          <Button
            variant="light"
            size="sm"
            startContent={<FiArrowUpRight />}
            onPress={() => navigate("/vaults")}
          >
            View All
          </Button>
        </CardHeader>
        <CardBody className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="w-3/4 rounded-lg mb-2">
                    <div className="h-4 rounded-lg bg-default-300" />
                  </Skeleton>
                  <Skeleton className="w-full rounded-lg">
                    <div className="h-2 rounded-lg bg-default-300" />
                  </Skeleton>
                </div>
              ))}
            </div>
          ) : vaults.length === 0 ? (
            <div className="text-center text-gray-400">No vaults yet.</div>
          ) : (
            vaults.map((vault) => {
              const docCount = docCountByVault[vault.id] || 0;
              const progress = maxDocCount > 0 ? Math.round((docCount / maxDocCount) * 100) : 0;

              return (
                <div key={vault.id}>
                  <div className="flex justify-between mb-2">
                    <div>
                      <span className="font-medium">{vault.name}</span>
                      <span className="text-sm text-gray-400 ml-3">{docCount} docs</span>
                    </div>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <Progress
                    value={progress}
                    className="max-w-full"
                    classNames={{
                      indicator: "bg-gradient-to-r from-brand-700 to-brand-900",
                    }}
                  />
                </div>
              );
            })
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default Dashboard;

