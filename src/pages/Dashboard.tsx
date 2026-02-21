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
  PendingApprovalData,
} from "../services/contract.service";
import { toast } from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { buttonClasses } from "../utils/buttonClasses";
import { shortenAddress } from "../utils/helpers";

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
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalData[]>([]);
  const [approvingRequestId, setApprovingRequestId] = useState<number | null>(null);

  useEffect(() => {
    if (isConnected && provider && isFujiNetwork) {
      contractService.initialize(provider, signer ?? undefined);
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [account, isConnected, provider, signer, isFujiNetwork]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [vaultsData, docsData, totalNFTs, activity] = await Promise.all([
        contractService.fetchVaults(),
        contractService.fetchDocuments(),
        contractService.getTotalSupply(),
        contractService.getRecentActivity(5),
      ]);
      const approvals = account
        ? await contractService.fetchPendingApprovalsForGuardian(account, 5)
        : [];

      const guardianSet = new Set<string>();
      vaultsData.forEach((vault) => {
        vault.guardians.forEach((guardian) => {
          guardianSet.add(guardian.toLowerCase());
        });
      });

      setVaults(vaultsData);
      setDocuments(docsData);
      setRecentActivity(activity);
      setPendingApprovals(approvals);
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

  const handleApproveRequest = async (requestId: number) => {
    setApprovingRequestId(requestId);
    try {
      await contractService.approveAccess(requestId);
      toast.success(`Approved request #${requestId}`);
      await loadDashboardData();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve request");
    } finally {
      setApprovingRequestId(null);
    }
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
            Connect your wallet to manage secure access vaults and family documents on Avalanche Fuji.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className={buttonClasses.primaryLg}
              onPress={connect}
              startContent={<FiKey />}
            >
              Connect Wallet
            </Button>
            <Button
              size="lg"
              className={buttonClasses.ghostLg}
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
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-gray-900/50 to-[#040306] border border-gray-800 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
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
              Your access setup is ready. Protect documents now and define emergency or inheritance release rules.
            </p>
          </div>
          <div className="w-full sm:w-auto lg:min-w-fit">
            <Button
              className={`${buttonClasses.primaryLg} w-full sm:w-auto`}
              onPress={handleCreateVault}
              startContent={<FiPlus />}
              size="lg"
            >
              Create Access Vault
            </Button>
          </div>
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
                <p className="text-gray-400 text-sm">Access Vaults</p>
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
                <p className="text-gray-400 text-sm">Legacy Documents</p>
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
                <p className="text-gray-400 text-sm">Access Passes</p>
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
            <Button className={buttonClasses.ghostSm} onPress={() => navigate("/vaults")}>View Access Vaults</Button>
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

        <div className="space-y-6">
          <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
            <CardHeader>
              <h2 className="text-xl font-semibold">Quick Actions</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <Link to="/vaults">
                <Button fullWidth className={`${buttonClasses.ghostLg} justify-start`}>
                  <FiShield className="mr-3" />
                  Create Access Vault
                </Button>
              </Link>
              <Link to="/documents">
                <Button fullWidth className={`${buttonClasses.ghostLg} justify-start`}>
                  <FiFile className="mr-3" />
                  Upload Legacy File
                </Button>
              </Link>
              <Link to="/nfts">
                <Button fullWidth className={`${buttonClasses.ghostLg} justify-start`}>
                  <FiKey className="mr-3" />
                  Mint Beneficiary Pass
                </Button>
              </Link>
              <Link to="/vaults">
                <Button fullWidth className={`${buttonClasses.ghostLg} justify-start`}>
                  <FiUsers className="mr-3" />
                  Add Guardian
                </Button>
              </Link>
            </CardBody>
          </Card>

          <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiCheckCircle />
                <h2 className="text-xl font-semibold">Approval Queue</h2>
              </div>
              <Chip size="sm" variant="flat" color="warning">
                {pendingApprovals.length} Pending
              </Chip>
            </CardHeader>
            <CardBody className="space-y-3">
              {loading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="rounded-lg">
                      <div className="h-16 rounded-lg bg-default-300" />
                    </Skeleton>
                  ))}
                </>
              ) : pendingApprovals.length === 0 ? (
                <p className="text-sm text-gray-400">No pending approvals assigned to your guardian account.</p>
              ) : (
                pendingApprovals.map((item) => (
                  <div key={item.requestId} className="rounded-xl border border-gray-800 bg-gray-900/45 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.vaultName}</p>
                        <p className="text-xs text-gray-400">
                          Request #{item.requestId} • Doc #{item.documentId}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className={buttonClasses.primarySm}
                        onPress={() => handleApproveRequest(item.requestId)}
                        isLoading={approvingRequestId === item.requestId}
                        isDisabled={approvingRequestId !== null}
                      >
                        Approve
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{shortenAddress(item.requester)}</span>
                      <span>
                        Expires {formatDistanceToNow(new Date(item.expiresAt * 1000), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Card className="border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiTrendingUp />
              <h2 className="text-xl font-semibold">Vault Activity</h2>
            </div>
          <Button
            className={buttonClasses.outlineSm}
            startContent={<FiArrowUpRight />}
            onPress={() => navigate("/vaults")}
          >
            View All Vaults
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
            <div className="text-center text-gray-400">No access vaults yet.</div>
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

