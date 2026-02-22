import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Avatar,
} from "@heroui/react";
import {
  FiHome,
  FiShield,
  FiFile,
  FiKey,
  FiUser,
  FiPlus,
  FiZap,
  FiChevronDown,
  FiMoreHorizontal,
  FiChevronLeft,
  FiChevronRight,
  FiUnlock,
} from "react-icons/fi";
import { useWeb3 } from "../context/Web3Context";
import { shortenAddress } from "../utils/helpers";
import { toast } from "react-hot-toast";
import { buttonClasses } from "../utils/buttonClasses";

const AvalancheLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <circle cx="32" cy="32" r="32" fill="#E84142" />
    <path
      fill="#FFFFFF"
      d="M34.6 14.1c-1.2-2.1-4.2-2.1-5.4 0L15.6 37.8c-1.2 2.1.3 4.8 2.7 4.8h7.4c1.2 0 2.3-.7 2.9-1.8l10.2-17.7c.6-1.1.6-2.4 0-3.5l-4.2-5.5z"
    />
    <path
      fill="#FFFFFF"
      d="M43.5 29.2c-1.2-2.1-4.2-2.1-5.4 0l-3.7 6.4c-1.2 2.1.3 4.8 2.7 4.8h7.3c2.4 0 3.9-2.7 2.7-4.8l-3.6-6.4z"
    />
  </svg>
);

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { account, isConnected, connect, disconnect, isFujiNetwork, switchToFuji } = useWeb3();
  const [nickname, setNickname] = useState("");
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(true);
  const desktopMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

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
    { path: "/dashboard", label: "Dashboard", icon: FiHome },
    { path: "/vaults", label: "Access Vaults", icon: FiShield },
    { path: "/documents", label: "Documents", icon: FiFile },
    { path: "/access", label: "My Access", icon: FiUnlock },
    { path: "/nfts", label: "Access Passes", icon: FiKey },
    { path: "/profile", label: "Profile", icon: FiUser },
  ];

  const mobileNavItems = [
    { path: "/dashboard", label: "Home", icon: FiHome },
    { path: "/vaults", label: "Vaults", icon: FiShield },
    { path: "/documents", label: "Docs", icon: FiFile },
    { path: "/nfts", label: "Passes", icon: FiKey },
    { path: "/profile", label: "Profile", icon: FiUser },
  ];

  const desktopRailItems = navItems.filter((item) => item.path !== "/profile");
  const desktopProfileItem = navItems.find((item) => item.path === "/profile");

  const isActive = (path: string) => location.pathname === path;

  const handleCreateVault = () => {
    navigate("/vaults?create=true");
  };

  const displayName = nickname || (account ? shortenAddress(account, 4) : "Guest");

  type ProfileMenuTone = "default" | "warning" | "danger";
  type ProfileMenuItem = {
    key: string;
    label: string;
    tone: ProfileMenuTone;
    onClick: () => void;
  };

  const profileMenuItems = useMemo(
    (): ProfileMenuItem[] => [
      {
        key: "profile",
        label: "Profile",
        tone: "default",
        onClick: () => navigate("/profile"),
      },
      {
        key: "access",
        label: "My Access",
        tone: "default",
        onClick: () => navigate("/access"),
      },
      {
        key: "copy",
        label: "Copy Address",
        tone: "default",
        onClick: () => {
          navigator.clipboard.writeText(account || "");
          toast.success("Address copied");
        },
      },
      ...(isFujiNetwork
        ? []
        : [
            {
              key: "switch",
              label: "Switch to Fuji",
              tone: "warning" as const,
              onClick: switchToFuji,
            },
          ]),
      {
        key: "disconnect",
        label: "Disconnect",
        tone: "danger",
        onClick: disconnect,
      },
    ],
    [account, disconnect, isFujiNetwork, navigate, switchToFuji]
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem("spoovault-desktop-sidebar-expanded");
      if (stored !== null) {
        setDesktopSidebarExpanded(stored === "1");
      }
    } catch {
      setDesktopSidebarExpanded(true);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("spoovault-desktop-sidebar-expanded", desktopSidebarExpanded ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }, [desktopSidebarExpanded]);

  useEffect(() => {
    setDesktopMenuOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(target)) {
        setDesktopMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setMobileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDesktopMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const profileMenuItemClass = (tone: ProfileMenuTone) =>
    `w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
      tone === "danger"
        ? "text-red-300 hover:bg-red-500/15"
        : tone === "warning"
        ? "text-yellow-300 hover:bg-yellow-500/15"
        : "text-gray-200 hover:bg-gray-800/80"
    }`;

  const toggleDesktopSidebar = () => {
    setDesktopMenuOpen(false);
    setDesktopSidebarExpanded((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-[#040306] to-gray-950">
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-screen border-r border-gray-800/80 bg-gray-950/90 backdrop-blur-2xl z-50 shadow-[18px_0_40px_-34px_rgba(0,0,0,0.95)] transition-[width] duration-300 overflow-visible ${
          desktopSidebarExpanded ? "w-[20rem]" : "w-[4.5rem]"
        }`}
      >
        <div className="w-[4.5rem] border-r border-gray-800/80 px-2 py-4 flex flex-col items-center">
          <div className="flex items-center gap-1.5 pb-4">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/90" />
          </div>

          <Link to="/dashboard" className="mb-4 group">
            <div className="w-11 h-11 rounded-xl bg-white/5 border border-gray-700/70 flex items-center justify-center shadow-lg shadow-brand-900/25 group-hover:border-brand-700/45 transition-colors">
              <AvalancheLogo className="w-6 h-6" />
            </div>
          </Link>

          <nav className="w-full flex-1 space-y-2">
            {desktopRailItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={`rail-${item.path}`}
                  to={item.path}
                  title={item.label}
                  className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                    active
                      ? "bg-brand-700/22 border-brand-700/55 text-brand-300 shadow-[0_6px_18px_-10px_rgba(220,38,38,0.8)]"
                      : "border-transparent text-gray-500 hover:text-gray-200 hover:border-gray-700/70 hover:bg-gray-900/80"
                  }`}
                >
                  <Icon className="text-[17px]" />
                </Link>
              );
            })}
          </nav>

          <Button
            isIconOnly
            onPress={handleCreateVault}
            className="w-11 h-11 min-w-11 rounded-xl border border-brand-700/45 bg-brand-700/15 text-brand-300 hover:bg-brand-700/25"
            aria-label="Create access vault"
          >
            <FiPlus className="text-[17px]" />
          </Button>

          {desktopProfileItem && (
            <Link
              to={desktopProfileItem.path}
              title={desktopProfileItem.label}
              className={`mt-2 mx-auto flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                isActive(desktopProfileItem.path)
                  ? "bg-brand-700/22 border-brand-700/55 text-brand-300"
                  : "border-transparent text-gray-500 hover:text-gray-200 hover:border-gray-700/70 hover:bg-gray-900/80"
              }`}
            >
              <desktopProfileItem.icon className="text-[17px]" />
            </Link>
          )}
        </div>

        {desktopSidebarExpanded && (
        <div className="flex-1 min-w-0 p-3 flex flex-col">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex-1 rounded-2xl border border-gray-800/85 bg-gray-900/75 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">SpooVault</p>
                  <p className="text-xs text-gray-400 truncate">spoovault.web.app</p>
                </div>
                <FiChevronDown className="text-gray-500 text-sm" />
              </div>
            </div>
            <Button
              isIconOnly
              onPress={toggleDesktopSidebar}
              className="h-10 w-10 min-w-10 rounded-xl border border-gray-700/75 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-600"
              aria-label="Collapse sidebar"
            >
              <FiChevronLeft className="text-[16px]" />
            </Button>
          </div>

          <div className="mt-3 rounded-xl border border-gray-800/80 bg-gray-900/65 px-3 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isFujiNetwork ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" : "bg-yellow-400"
                }`}
              />
              <p
                className={`text-xs font-medium truncate ${
                  isFujiNetwork ? "text-green-300" : "text-yellow-300"
                }`}
              >
                {isFujiNetwork ? "Avalanche Fuji Online" : "Wrong Network"}
              </p>
            </div>
            {!isFujiNetwork && (
              <button
                type="button"
                onClick={switchToFuji}
                className="text-[11px] font-semibold text-yellow-300 hover:text-yellow-200"
              >
                Switch
              </button>
            )}
          </div>

          <nav className="mt-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={`panel-${item.path}`}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                    active
                      ? "border-gray-700/90 bg-white/10 text-white"
                      : "border-transparent text-gray-400 hover:text-gray-100 hover:border-gray-800/80 hover:bg-gray-900/70"
                  }`}
                >
                  <Icon className={`text-base ${active ? "text-brand-300" : "text-gray-500"}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 space-y-3">
            <Button
              onPress={handleCreateVault}
              className={`w-full ${buttonClasses.primarySm}`}
              startContent={<FiPlus className="text-base" />}
            >
              Create Access Vault
            </Button>

            {isConnected ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-gray-800/80 bg-gray-900/70 p-2.5">
                <Avatar
                  className="bg-gradient-to-br from-brand-700 to-brand-900 flex-shrink-0"
                  name={nickname || account?.substring(2, 6)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{displayName}</p>
                  <p className="text-[11px] text-gray-500 truncate">{shortenAddress(account || "", 4)}</p>
                </div>
                <div className="relative" ref={desktopMenuRef}>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    onPress={() => {
                      setDesktopMenuOpen((open) => !open);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <FiMoreHorizontal />
                  </Button>
                  {desktopMenuOpen && (
                    <div className="absolute right-0 bottom-10 z-40 w-44 rounded-xl border border-gray-700/80 bg-gray-950/95 p-1 shadow-2xl">
                      {profileMenuItems.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          className={profileMenuItemClass(item.tone)}
                          onClick={() => {
                            item.onClick();
                            setDesktopMenuOpen(false);
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Button
                onPress={connect}
                className={`w-full ${buttonClasses.ghostMd}`}
                startContent={<FiZap className="text-brand-400" />}
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
        )}

        {!desktopSidebarExpanded && (
          <button
            type="button"
            onClick={toggleDesktopSidebar}
            aria-label="Expand sidebar"
            className="absolute -right-3 top-1/2 -translate-y-1/2 h-16 w-6 rounded-r-full border border-gray-700/75 bg-gray-100/90 text-gray-900 shadow-[0_14px_28px_-16px_rgba(0,0,0,0.8)] hover:bg-white transition-colors"
          >
            <FiChevronRight className="mx-auto text-[15px]" />
          </button>
        )}
      </aside>

      <header className="lg:hidden fixed top-0 inset-x-0 z-40 border-b border-gray-800/80 bg-gray-950/92 backdrop-blur-2xl">
        <div className="h-16 px-3.5 flex items-center gap-2">
          <Link to="/dashboard" className="min-w-0 flex-1 flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-gray-700/60 flex items-center justify-center shadow-lg shadow-brand-900/30">
              <AvalancheLogo className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-none truncate">SpooVault</p>
              <p className="text-[11px] text-gray-400 mt-1 truncate">Family Access App</p>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isFujiNetwork ? (
              <span
                title="Avalanche Fuji"
                className="inline-flex w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-green-500/25"
              />
            ) : (
              <Button
                isIconOnly
                size="sm"
                onPress={switchToFuji}
                className="w-8 h-8 min-w-8 rounded-xl border border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
              >
                <FiZap className="text-[14px]" />
              </Button>
            )}
            {isConnected ? (
              <div className="relative" ref={mobileMenuRef}>
                <button
                  type="button"
                  className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/70"
                  aria-label="Open account menu"
                  onClick={() => {
                    setMobileMenuOpen((open) => !open);
                    setDesktopMenuOpen(false);
                  }}
                >
                  <Avatar
                    className="w-8 h-8 bg-gradient-to-br from-brand-700 to-brand-900"
                    name={nickname || account?.substring(2, 6)}
                  />
                </button>
                {mobileMenuOpen && (
                  <div className="absolute right-0 top-11 z-50 w-44 rounded-xl border border-gray-700/80 bg-gray-950/95 p-1 shadow-2xl">
                    {profileMenuItems.map((item) => (
                      <button
                        key={`mobile-${item.key}`}
                        type="button"
                        className={profileMenuItemClass(item.tone)}
                        onClick={() => {
                          item.onClick();
                          setMobileMenuOpen(false);
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                onPress={connect}
                className={`${buttonClasses.primarySm} !px-3 !min-w-[4.25rem]`}
              >
                Connect
              </Button>
            )}
          </div>
        </div>
      </header>

      <main
        className={`min-h-screen pt-20 pb-24 lg:pt-0 lg:pb-0 transition-[margin] duration-300 ${
          desktopSidebarExpanded ? "lg:ml-[20rem]" : "lg:ml-[4.5rem]"
        }`}
      >
        <div className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-md rounded-2xl border border-gray-800/80 bg-gray-900/92 backdrop-blur-2xl shadow-[0_16px_30px_-22px_rgba(0,0,0,0.95)]">
          <div className="grid grid-cols-5 gap-1 p-1.5">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-all ${
                    active
                      ? "bg-brand-700/18 border border-brand-700/35 text-brand-300"
                      : "border border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/55"
                  }`}
                >
                  <Icon className={`text-[16px] ${active ? "text-brand-300" : "text-gray-500"}`} />
                  <span className={`text-[10px] leading-none ${active ? "text-brand-300" : "text-gray-500"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
