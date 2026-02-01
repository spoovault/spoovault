import { useState } from "react";
import {
  Button,
  Navbar,
  NavbarContent,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/react";
import {
  FiZap,
  FiShield,
  FiLock,
  FiUsers,
  FiArrowRight,
  FiGlobe,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navItems = [
    { label: "Overview", href: "#hero" },
    { label: "Features", href: "#features" },
    { label: "Workflow", href: "#workflow" },
    { label: "Get Started", href: "#cta" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#040306] via-gray-950 to-[#040306] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-brand-700/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-brand-700/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-brand-900/5 rounded-full blur-3xl animate-pulse delay-500" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
      </div>

      <Navbar
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        className="relative z-10 border-b border-gray-800/50 bg-gray-950/70 backdrop-blur-xl"
        maxWidth="xl"
        height="4.5rem"
      >
        <NavbarContent className="md:hidden" justify="start">
          <NavbarMenuToggle
            aria-label="Toggle navigation menu"
            icon={isMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            className="text-gray-300"
          />
        </NavbarContent>

        <NavbarContent justify="start" className="gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-700 to-brand-900 rounded-xl flex items-center justify-center animate-pulse-glow">
              <FiLock className="text-white text-xl" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-700 to-brand-900 bg-clip-text text-transparent">
                SpooVault
              </h1>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <p className="text-xs text-gray-400">Avalanche Fuji</p>
              </div>
            </div>
          </Link>
        </NavbarContent>

        <NavbarContent justify="center" className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              {item.label}
            </a>
          ))}
        </NavbarContent>

        <NavbarContent justify="end" className="gap-2">
          <Link to="/dashboard" className="hidden sm:flex">
            <Button variant="flat" className="border border-gray-700 text-gray-200">
              Launch App
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button
              className="bg-gradient-to-r from-brand-700 to-brand-900 font-semibold hover:shadow-xl hover:shadow-brand-800/20 transition-all"
              endContent={<FiArrowRight />}
            >
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
                Launch App
              </Button>
            </Link>
          </NavbarMenuItem>
        </NavbarMenu>
      </Navbar>

      <section id="hero" className="relative z-10 pt-16 sm:pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-700/10 to-brand-900/10 border border-brand-700/20 mb-8 animate-float">
            <span className="w-2 h-2 bg-gradient-to-r from-brand-700 to-brand-900 rounded-full animate-pulse" />
            <span className="text-sm font-medium bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent">
              ENTERPRISE GRADE - MULTI-SIG SECURITY
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
            <span className="block text-gray-300">Document Vaults</span>
            <span className="block bg-gradient-to-r from-brand-700 via-brand-800 to-brand-800 bg-clip-text text-transparent bg-size-200 animate-gradient">
              Powered by Avalanche
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Secure sensitive documents with client-side encryption, multi-signature approvals,
            and NFT-based access control running on Avalanche.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/dashboard" className="flex-1 sm:flex-none">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-brand-700 to-brand-900 text-white font-bold py-6 px-10 text-lg hover:shadow-2xl hover:shadow-brand-800/30 transform hover:-translate-y-0.5 transition-all duration-300 group"
                endContent={<FiZap className="group-hover:rotate-12 transition-transform" />}
              >
                <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  Connect Wallet & Start
                </span>
              </Button>
            </Link>
            <Link to="#features" className="flex-1 sm:flex-none">
              <Button
                size="lg"
                variant="flat"
                className="w-full sm:w-auto border-2 border-gray-700 bg-gray-900/50 font-bold py-6 px-10 text-lg hover:border-brand-700/50 transition-colors"
              >
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-gray-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Why <span className="bg-gradient-to-r from-brand-700 to-brand-900 bg-clip-text text-transparent">SpooVault</span>?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Enterprise-grade document security powered by Avalanche's high-performance blockchain
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: <FiShield className="text-2xl sm:text-3xl" />,
                title: "Multi-Signature Security",
                description: "Require multiple approvals for document access with customizable thresholds.",
                features: ["2-of-3 to 5-of-7 setups", "Role-based permissions", "Time-locked approvals"],
                gradient: "from-brand-700 to-brand-900",
              },
              {
                icon: <FiLock className="text-2xl sm:text-3xl" />,
                title: "Client-Side Encryption",
                description: "AES-256 encryption before upload. Your keys, your data.",
                features: ["End-to-end encryption", "Zero-knowledge storage", "Key splitting"],
                gradient: "from-brand-700 to-brand-900",
              },
              {
                icon: <FiUsers className="text-2xl sm:text-3xl" />,
                title: "NFT Access Control",
                description: "ERC-721 tokens manage document access. Mint, transfer, or burn tokens.",
                features: ["Token-gated access", "Transferable permissions", "Instant revoke"],
                gradient: "from-brand-700 to-brand-900",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-gray-900/30 to-gray-900/10 border border-gray-800 backdrop-blur-sm hover:border-brand-700/50 transition-all duration-500 hover:scale-[1.02]"
              >
                <div
                  className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-700" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Encrypt locally, store on IPFS, and unlock with multi-signature approvals.
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
                className="p-6 rounded-3xl border border-gray-800 bg-gray-900/30 backdrop-blur-sm"
              >
                <div className="text-xs text-brand-500 font-semibold mb-3">
                  STEP {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/50 to-[#040306] border border-gray-800 p-8 sm:p-12">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-700/10 rounded-full blur-3xl" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-brand-700/10 rounded-full blur-3xl" />

            <div className="relative z-10 text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                Ready to Secure Your Documents?
              </h2>
              <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                Deploy multi-sig vaults, encrypt files client-side, and manage access on Avalanche.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/dashboard" className="flex-1 sm:flex-none">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-brand-700 to-brand-900 font-bold py-6 px-10 text-lg hover:shadow-2xl hover:shadow-brand-800/30 transition-all group"
                    endContent={<FiArrowRight className="group-hover:translate-x-1 transition-transform" />}
                  >
                    Launch App Now
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="flat"
                  className="flex-1 sm:flex-none border-2 border-gray-700 bg-transparent font-bold py-6 px-10 text-lg hover:border-brand-700 transition-colors"
                  startContent={<FiGlobe />}
                >
                  Read Documentation
                </Button>
              </div>
            </div>
          </div>
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
              <p>Built on Avalanche ? ? {new Date().getFullYear()} All rights reserved</p>
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

