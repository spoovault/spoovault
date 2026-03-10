import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Button, Input, Chip } from "@heroui/react";
import { FiUser, FiSliders, FiSave, FiUsers, FiClock, FiCheckCircle } from "react-icons/fi";
import { useWeb3 } from "../context/Web3Context";
import { formatDate, shortenAddress } from "../utils/helpers";
import { toast } from "react-hot-toast";
import { buttonClasses } from "../utils/buttonClasses";
import { contractService, GuardianInviteData } from "../services/contract.service";

interface InviteVaultContext {
  name: string;
  description: string;
  creator: string;
}

const Profile = () => {
  const { account, isConnected, connect, provider, signer, isFujiNetwork, switchToFuji } = useWeb3();
  const [nickname, setNickname] = useState("");
  const [theme, setTheme] = useState<"ember" | "midnight">("ember");
  const [pendingInvites, setPendingInvites] = useState<GuardianInviteData[]>([]);
  const [inviteVaultContextById, setInviteVaultContextById] = useState<Record<number, InviteVaultContext>>({});
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [acceptingVaultId, setAcceptingVaultId] = useState<number | null>(null);
  const profileInputClassNames = {
    inputWrapper: "bg-gray-900/75 border border-gray-700/80 shadow-none data-[hover=true]:border-gray-600",
    input: "text-sm text-gray-100",
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("spoovault-profile");
      if (stored) {
        const parsed = JSON.parse(stored) as { nickname?: string; theme?: "ember" | "midnight" };
        if (parsed.nickname) {
          setNickname(parsed.nickname);
        }
        if (parsed.theme) {
          setTheme(parsed.theme);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (isConnected && provider) {
      contractService.initialize(provider, signer ?? undefined);
      loadPendingInvites();
    } else {
      setPendingInvites([]);
    }
  }, [account, isConnected, provider, signer, isFujiNetwork]);

  const loadPendingInvites = async () => {
    if (!account || !isFujiNetwork) {
      setPendingInvites([]);
      setInviteVaultContextById({});
      return;
    }

    setLoadingInvites(true);
    try {
      const invites = await contractService.fetchPendingInvites(account);
      const sorted = [...invites].sort((a, b) => a.expiresAt - b.expiresAt);
      setPendingInvites(sorted);

      if (sorted.length === 0) {
        setInviteVaultContextById({});
        return;
      }

      const inviteVaultIds = new Set<number>(sorted.map((invite) => invite.vaultId));
      const vaults = await contractService.fetchVaultsByIds(Array.from(inviteVaultIds));
      const contextMap: Record<number, InviteVaultContext> = {};
      vaults.forEach((vault) => {
        if (!inviteVaultIds.has(vault.id)) return;
        contextMap[vault.id] = {
          name: vault.name || `Vault #${vault.id}`,
          description: vault.description || "",
          creator: vault.creator || "",
        };
      });
      setInviteVaultContextById(contextMap);
    } catch (error) {
      console.error("Error loading pending invites:", error);
      setInviteVaultContextById({});
      toast.error("Failed to load guardian invites");
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleSave = () => {
    const trimmedNickname = nickname.trim();
    try {
      localStorage.setItem(
        "spoovault-profile",
        JSON.stringify({ nickname: trimmedNickname, theme })
      );
      window.dispatchEvent(
        new CustomEvent("spoovault-profile-updated", {
          detail: { nickname: trimmedNickname, theme },
        })
      );
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const handleAcceptInvite = async (vaultId: number) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      await connect();
      return;
    }

    if (!isFujiNetwork) {
      toast.error("Please switch to Avalanche Fuji network");
      return;
    }

    setAcceptingVaultId(vaultId);
    try {
      await contractService.acceptGuardianInvite(vaultId);
      toast.success(`Guardian invite accepted for Vault #${vaultId}`);
      await loadPendingInvites();
    } catch (error: any) {
      toast.error(error.message || "Failed to accept guardian invite");
    } finally {
      setAcceptingVaultId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-gray-400">Manage your preferences</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-gray-800 bg-gray-900/40 backdrop-blur-sm">
          <CardHeader className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center">
              <FiUser className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Identity</h2>
              <p className="text-sm text-gray-400">Nickname and wallet info</p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-300 font-medium">Nickname</p>
              <Input
                placeholder="e.g. RedFox"
                value={nickname}
                onValueChange={setNickname}
                classNames={profileInputClassNames}
              />
            </div>
            <div className="text-sm text-gray-400">
              Wallet: {isConnected ? shortenAddress(account || "", 6) : "Not connected"}
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-800 bg-gray-900/40 backdrop-blur-sm">
          <CardHeader className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center">
              <FiSliders className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Theme</h2>
              <p className="text-sm text-gray-400">Choose your preferred look</p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                className={theme === "ember" ? buttonClasses.primaryMd : buttonClasses.ghostMd}
                onPress={() => setTheme("ember")}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-orange-300 via-orange-500 to-red-600" />
                  <span>Ember</span>
                </span>
              </Button>
              <Button
                className={theme === "midnight" ? buttonClasses.primaryMd : buttonClasses.ghostMd}
                onPress={() => setTheme("midnight")}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-blue-400 via-indigo-500 to-slate-700" />
                  <span>Midnight</span>
                </span>
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Preferences are saved locally on this device.
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          className={buttonClasses.primaryMd}
          startContent={<FiSave />}
          onPress={handleSave}
        >
          Save Changes
        </Button>
      </div>

      <Card className="border border-gray-800 bg-gray-900/40 backdrop-blur-sm">
        <CardHeader className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center">
              <FiUsers className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Guardian Invites</h2>
              <p className="text-sm text-gray-400">Accept vault invitations assigned to this wallet</p>
            </div>
          </div>
          <Chip size="sm" variant="flat" color="warning">
            {pendingInvites.length} Pending
          </Chip>
        </CardHeader>
        <CardBody className="space-y-3">
          {!isConnected ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/55 p-4 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-400">Connect wallet to view pending guardian invites.</p>
              <Button className={buttonClasses.primarySm} onPress={connect}>
                Connect
              </Button>
            </div>
          ) : !isFujiNetwork ? (
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-center justify-between gap-3">
              <p className="text-sm text-yellow-200">Switch to Avalanche Fuji to load and accept invites.</p>
              <Button className={buttonClasses.outlineSm} onPress={switchToFuji}>
                Switch Network
              </Button>
            </div>
          ) : loadingInvites ? (
            <p className="text-sm text-gray-400">Loading pending invites...</p>
          ) : pendingInvites.length === 0 ? (
            <p className="text-sm text-gray-400">No pending guardian invites.</p>
          ) : (
            pendingInvites.map((invite) => (
              <div
                key={`${invite.vaultId}-${invite.expiresAt}`}
                className="rounded-2xl border border-gray-800 bg-gray-900/55 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1.5 min-w-0">
                  <p className="font-medium truncate">
                    {inviteVaultContextById[invite.vaultId]?.name || `Vault #${invite.vaultId}`}
                  </p>
                  <p className="text-xs text-gray-400 break-words">
                    {inviteVaultContextById[invite.vaultId]?.description?.trim() ||
                      "No vault description provided."}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <Chip size="sm" variant="flat" className="bg-gray-900/70 border border-gray-700/70 text-gray-300">
                      Vault #{invite.vaultId}
                    </Chip>
                    <span>
                      {inviteVaultContextById[invite.vaultId]?.creator
                        ? `From owner ${shortenAddress(inviteVaultContextById[invite.vaultId].creator, 6)}`
                        : `Assigned to ${shortenAddress(invite.guardian, 6)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <FiClock />
                    <span>Expires {formatDate(invite.expiresAt)}</span>
                  </div>
                </div>
                <Button
                  className={buttonClasses.primarySm}
                  startContent={<FiCheckCircle />}
                  onPress={() => handleAcceptInvite(invite.vaultId)}
                  isLoading={acceptingVaultId === invite.vaultId}
                  isDisabled={acceptingVaultId !== null}
                >
                  Accept Invite
                </Button>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default Profile;
