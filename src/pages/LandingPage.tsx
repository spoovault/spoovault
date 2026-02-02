import { useEffect, useState } from "react";
import {
  Button,
  Navbar,
  NavbarContent,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Card,
  CardBody,
  CardHeader,
  Chip,
} from "@heroui/react";
import {
  FiShield,
  FiLock,
  FiUsers,
  FiArrowRight,
  FiMenu,
  FiX,
  FiKey,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navItems = [
    { label: "Overview", href: "#hero" },
    { label: "Features", href: "#features" },
    { label: "Workflow", href: "#workflow" },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050308] via-[#07060c] to-[#040306] overflow-x-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-brand-700/10 blur-[120px]" />
        <div className="absolute top-40 -left-24 h-64 w-64 rounded-full bg-brand-900/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-brand-700/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),transparent_55%)]" />
      </div>

      <Navbar
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          isScrolled
            ? "bg-white/90 backdrop-blur-xl border-gray-200/60 shadow-lg shadow-black/5"
            : "bg-gray-950/60 backdrop-blur-xl border-gray-800/40"
        }`}
        maxWidth="xl"
        height="5rem"
      >
        <NavbarContent className="md:hidden" justify="start">
          <NavbarMenuToggle
            aria-label="Toggle navigation menu"
            icon={isMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            className={isScrolled ? "text-gray-700" : "text-gray-300"}
          />
        </NavbarContent>

        <NavbarContent justify="start" className="hidden md:flex flex-1">
          <Link to="/" className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isScrolled
                ? "bg-gray-900 text-white"
                : "bg-gradient-to-br from-brand-700 to-brand-900 text-white"
            }`}>
              <FiLock className="text-xl" />
            </div>
            <div className="hidden lg:block">
              <h1 className={`text-xl font-bold ${isScrolled ? "text-gray-900" : "text-white"}`}>
                SpooVault
              </h1>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <p className={`text-xs ${isScrolled ? "text-gray-500" : "text-gray-400"}`}>
                  Avalanche Fuji
                </p>
              </div>
            </div>
          </Link>
        </NavbarContent>

        <NavbarContent justify="center" className="flex-1">
          <div
            className={`hidden md:flex items-center gap-4 rounded-full px-4 py-2 shadow-2xl backdrop-blur-2xl transition-colors border-orbit ${
              isScrolled ? "border-orbit-light" : ""
            }`}
          >
            <div className="relative z-10 flex items-center gap-6 px-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`text-sm transition-colors ${
                    isScrolled ? "text-gray-700 hover:text-gray-900" : "text-gray-300 hover:text-white"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </NavbarContent>

        <NavbarContent justify="end" className="flex-1">
          <Link to="/dashboard" className="hidden md:flex">
            <Button className={isScrolled
              ? "bg-gray-900 text-white font-semibold"
              : "bg-gradient-to-r from-brand-700 to-brand-900 font-semibold"
            }>
              Get Started
            </Button>
          </Link>
          <Link to="/dashboard" className="md:hidden">
            <Button className="bg-gradient-to-r from-brand-700 to-brand-900 font-semibold">
              Get Started
            </Button>
          </Link>
        </NavbarContent>

        <NavbarMenu className="bg-gray-950/95 backdrop-blur-2xl pt-6">
          {navItems.map((item) => (
            <NavbarMenuItem key={item.href}>
              <a
                href={item.href}
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-gray-300 hover:text-white hover:bg-gray-800/60 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            </NavbarMenuItem>
          ))}
          <NavbarMenuItem>
            <Link to="/dashboard" className="block w-full">
              <Button className="w-full bg-gradient-to-r from-brand-700 to-brand-900">
                Get Started
              </Button>
            </Link>
          </NavbarMenuItem>
        </NavbarMenu>
      </Navbar>

      <section id="hero" className="relative z-10 pt-16 sm:pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="w-2 h-2 bg-brand-600 rounded-full" />
              <span className="text-xs uppercase tracking-[0.2em] text-gray-300">
                Multi-sig document security
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-white">
              Own your sensitive files with
              <span className="block text-brand-400">on-chain vaults</span>
            </h1>
            <p className="mt-5 text-lg text-gray-400 max-w-xl">
              Encrypt locally, store on IPFS, and control access with guardians and NFT keys.
              Built for teams that can't afford leaks.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/dashboard">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-brand-700 to-brand-900 text-white font-semibold px-8"
                  endContent={<FiArrowRight />}
                >
                  Get Started
                </Button>
              </Link>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <FiShield className="text-brand-500" />
                Auditable access with real-time events
              </div>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              {["Client-side AES-256", "Guardian approvals", "NFT access tokens"].map((item) => (
                <Chip
                  key={item}
                  variant="flat"
                  className="bg-white/5 border border-white/10 text-gray-300"
                >
                  {item}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border border-gray-800/60 bg-gray-900/40 backdrop-blur-sm glass-elevated">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Vault</p>
                  <h3 className="text-xl font-semibold text-white">Legal Operations</h3>
                </div>
                <Chip className="bg-brand-700/20 text-brand-300">3 of 5</Chip>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Documents</span>
                  <span className="text-white">18</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Guardians</span>
                  <span className="text-white">5</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Last activity</span>
                  <span className="text-white">2 mins ago</span>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-gray-800/60 bg-gray-900/40 backdrop-blur-sm glass-elevated">
              <CardBody className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Encrypted Upload</p>
                  <h4 className="text-lg font-semibold text-white">Q2 Financials.pdf</h4>
                </div>
                <Button
                  variant="flat"
                  className="bg-brand-700/20 text-brand-200 border border-brand-700/30"
                  startContent={<FiLock />}
                >
                  Secured
                </Button>
              </CardBody>
            </Card>

            <Card className="border border-gray-800/60 bg-gray-900/40 backdrop-blur-sm glass-elevated">
              <CardBody className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">NFT Gate</p>
                  <h4 className="text-lg font-semibold text-white">Access Token #42</h4>
                </div>
                <FiKey className="text-brand-400 text-2xl" />
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 text-white">
              Built for teams that need
              <span className="text-brand-400"> serious control</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From vault creation to approval flows, everything is transparent, auditable, and fast.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {[
              {
                icon: <FiShield className="text-2xl" />,
                title: "Multi-guardian vaults",
                description: "Define approval thresholds and track every access request on-chain.",
              },
              {
                icon: <FiLock className="text-2xl" />,
                title: "Local encryption",
                description: "Files are encrypted in your browser before they ever touch IPFS.",
              },
              {
                icon: <FiUsers className="text-2xl" />,
                title: "NFT keys",
                description: "Mint access tokens for teams, revoke instantly when needed.",
              },
            ].map((feature) => (
              <Card key={feature.title} className="border border-gray-800/60 bg-gray-900/40 backdrop-blur-sm glass-elevated">
                <CardHeader className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-700/20 text-brand-300 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                </CardHeader>
                <CardBody>
                  <p className="text-gray-400">{feature.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 text-white">
              Simple flow, serious security
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Every step is designed to keep control with you and your guardians.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Encrypt & Upload",
                description: "Files are encrypted client-side before being pinned to IPFS.",
              },
              {
                step: "02",
                title: "Request Access",
                description: "Access requires NFT ownership and guardian approvals.",
              },
              {
                step: "03",
                title: "Decrypt Securely",
                description: "Keys stay with guardians and decrypt locally on approval.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-3xl border border-gray-800/70 bg-gray-900/30 backdrop-blur-sm"
              >
                <div className="text-xs text-brand-500 font-semibold mb-3">
                  STEP {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border border-gray-800/70 bg-gradient-to-br from-gray-900/60 to-[#050308] backdrop-blur-sm glass-elevated">
            <CardBody className="relative overflow-hidden p-8 sm:p-12 text-center">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-700/10 rounded-full blur-3xl" />
              <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-brand-700/10 rounded-full blur-3xl" />
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4 text-white">
                Ready to secure your documents?
              </h2>
              <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                Create your first vault in minutes. No server setup. No trust required.
              </p>
              <Link to="/dashboard">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-brand-700 to-brand-900 font-semibold px-10"
                  endContent={<FiArrowRight />}
                >
                  Get Started
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </section>

      <footer className="relative z-10 border-t border-gray-800/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-700 to-brand-900 rounded-xl flex items-center justify-center">
                <FiLock className="text-white" />
              </div>
              <div>
                <span className="text-lg font-bold">SpooVault</span>
                <p className="text-xs text-gray-400">Document Security on Avalanche</p>
              </div>
            </div>
            <div className="text-gray-400 text-sm text-center md:text-right">
              <p>Built on Avalanche (c) {new Date().getFullYear()} All rights reserved</p>
              <p className="text-xs mt-1">Enterprise-grade multi-signature document vaults</p>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .bg-size-200 {
          background-size: 200% auto;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;

