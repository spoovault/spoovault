import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Navbar,
  NavbarContent,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  FiHome,
  FiShield,
  FiFile,
  FiKey,
  FiMenu,
  FiX,
  FiUser,
  FiLogOut,
  FiBell,
  FiPlus,
  FiZap,
  FiLock,
} from "react-icons/fi";
import { useWeb3 } from "../context/Web3Context";
import { shortenAddress } from "../utils/helpers";
import { toast } from "react-hot-toast";

const AppLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { account, isConnected, connect, disconnect, isFujiNetwork, switchToFuji } = useWeb3();
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    const readProfile = () => {
      try {
        const stored = localStorage.getItem("spoovault-profile");
        if (stored) {
          const parsed = JSON.parse(stored) as { nickname?: string };
          setNickname(parsed.nickname ?? "");
        } else {
          setNickname("");
        }
      } catch {
        setNickname("");
      }
    };

    readProfile();

    const handleProfileUpdate = () => readProfile();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "spoovault-profile") {
        readProfile();
      }
    };

    window.addEventListener("spoovault-profile-updated", handleProfileUpdate as EventListener);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("spoovault-profile-updated", handleProfileUpdate as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <FiHome /> },
    { path: "/vaults", label: "Vaults", icon: <FiShield /> },
    { path: "/documents", label: "Documents", icon: <FiFile /> },
    { path: "/nfts", label: "NFT Gallery", icon: <FiKey /> },
    { path: "/profile", label: "Profile", icon: <FiUser /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleCreateVault = () => {
    navigate("/vaults?create=true");
  };

  const displayName = nickname || (account ? shortenAddress(account, 4) : "Guest");
  const profileMenuItems = [
    {
      key: "profile",
      label: "Profile",
      onClick: () => navigate("/profile"),
    },
    {
      key: "copy",
      label: "Copy Address",
      onClick: () => {
        navigator.clipboard.writeText(account || "");
        toast.success("Address copied!");
      },
    },
    ...(isFujiNetwork
      ? []
      : [
          {
            key: "switch",
            label: "Switch to Fuji",
            onClick: switchToFuji,
          },
        ]),
    {
      key: "disconnect",
      label: "Disconnect",
      color: "danger" as const,
      onClick: disconnect,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-[#040306] to-gray-950">
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-gray-800 bg-gray-900/50 backdrop-blur-2xl z-50">
        <div className="p-6 border-b border-gray-800">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-700 to-brand-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 glow">
              <FiLock className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-brand-700 to-brand-900 bg-clip-text text-transparent">
                SpooVault
              </h1>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xs text-gray-400">Avalanche Fuji</p>
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                isActive(item.path)
                  ? "bg-gradient-to-r from-brand-700/20 to-brand-900/20 text-white border border-brand-700/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`${isActive(item.path) ? "text-brand-400" : "text-gray-500"} group-hover:text-brand-400`}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4">
          <Button
            onPress={handleCreateVault}
            className="w-full bg-gradient-to-r from-brand-700 to-brand-900 font-semibold hover:shadow-xl hover:shadow-brand-800/20 transition-all duration-300"
            startContent={<FiPlus className="text-lg" />}
          >
            Create Vault
          </Button>
        </div>

        <div className="p-4 border-t border-gray-800 space-y-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isFujiNetwork ? "bg-green-500/10 border border-green-500/20" : "bg-yellow-500/10 border border-yellow-500/20"
          }`}>
            <div className={`w-2 h-2 rounded-full ${isFujiNetwork ? "bg-green-500" : "bg-yellow-500"} animate-pulse`} />
            <span className={`text-xs font-medium ${isFujiNetwork ? "text-green-400" : "text-yellow-400"}`}>
              {isFujiNetwork ? "Avalanche Fuji" : "Wrong Network"}
            </span>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50">
              <Avatar
                className="bg-gradient-to-br from-brand-700 to-brand-900 flex-shrink-0"
                name={nickname || account?.substring(2, 6)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                {nickname && (
                  <p className="text-xs text-gray-500 truncate">
                    {shortenAddress(account || "", 4)}
                  </p>
                )}
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <p className="text-xs text-green-400">Connected</p>
                </div>
              </div>
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="light" size="sm" className="text-gray-400 hover:text-white">
                    <FiUser />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Profile actions" className="dark">
                  {profileMenuItems.map((item) => (
                    <DropdownItem key={item.key} color={item.color} onClick={item.onClick}>
                      {item.label}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>
          ) : (
            <Button
              onPress={connect}
              className="w-full bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 font-medium hover:border-brand-700 transition-colors"
              startContent={<FiZap className="text-brand-400" />}
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </aside>

      <Navbar
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        className="lg:hidden bg-gray-900/80 backdrop-blur-2xl border-b border-gray-800 fixed top-0 z-40"
        maxWidth="full"
        height="4rem"
      >
        <NavbarContent className="gap-2">
          <NavbarMenuToggle
            icon={isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            className="text-gray-400"
            aria-label="Toggle navigation menu"
          />
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-700 to-brand-900 rounded-lg flex items-center justify-center">
              <FiLock className="text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-brand-700 to-brand-900 bg-clip-text text-transparent">
              SpooVault
            </span>
          </Link>
        </NavbarContent>

        <NavbarContent justify="end" className="gap-2">
          {isConnected ? (
            <>
              <Button isIconOnly variant="light" size="sm" className="text-gray-400">
                <FiBell />
              </Button>
              <Avatar
                className="w-8 h-8 bg-gradient-to-br from-brand-700 to-brand-900"
                name={nickname || account?.substring(2, 6)}
              />
            </>
          ) : (
            <Button
              size="sm"
              onPress={connect}
              className="bg-gradient-to-r from-brand-700 to-brand-900 font-medium"
            >
              Connect
            </Button>
          )}
        </NavbarContent>

        <NavbarMenu className="bg-gray-900/95 backdrop-blur-2xl pt-4 px-4">
          {navItems.map((item) => (
            <NavbarMenuItem key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center justify-between py-3 px-2 rounded-lg ${
                  isActive(item.path)
                    ? "bg-gradient-to-r from-brand-700/20 to-brand-900/20 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            </NavbarMenuItem>
          ))}

          <div className="mt-4 pt-4 border-t border-gray-800">
            {isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Wallet</span>
                  <span className="font-mono">{shortenAddress(account || "", 4)}</span>
                </div>
                {nickname && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Nickname</span>
                    <span className="font-medium">{nickname}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Network</span>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${isFujiNetwork ? "bg-green-500" : "bg-yellow-500"}`} />
                    <span className={isFujiNetwork ? "text-green-400" : "text-yellow-400"}>
                      {isFujiNetwork ? "Fuji" : "Wrong Net"}
                    </span>
                  </div>
                </div>
                <Button
                  fullWidth
                  variant="flat"
                  onPress={() => {
                    navigate("/profile");
                    setIsMenuOpen(false);
                  }}
                  startContent={<FiUser />}
                >
                  Profile
                </Button>
                <Button
                  fullWidth
                  color="danger"
                  variant="light"
                  onPress={disconnect}
                  startContent={<FiLogOut />}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                fullWidth
                onPress={connect}
                className="bg-gradient-to-r from-brand-700 to-brand-900 font-medium"
                startContent={<FiZap />}
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </NavbarMenu>
      </Navbar>

      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {isConnected && (
        <div className="lg:hidden fixed bottom-6 right-6 z-30">
          <Button
            isIconOnly
            className="w-14 h-14 bg-gradient-to-br from-brand-700 to-brand-900 text-white shadow-2xl shadow-brand-800/30 hover:scale-110 transition-transform"
            radius="full"
            onPress={handleCreateVault}
          >
            <FiPlus className="text-xl" />
          </Button>
        </div>
      )}

    </div>
  );
};

export default AppLayout;

