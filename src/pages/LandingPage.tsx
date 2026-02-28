import { UIEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Navbar,
  NavbarContent,
} from "@heroui/react";
import {
  FiArrowRight,
  FiShield,
  FiLock,
  FiMenu,
  FiX,
  FiCheckCircle,
  FiFileText,
  FiKey,
  FiClock,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { getCurrentYear } from "../utils/helpers";
import { buttonClasses } from "../utils/buttonClasses";
import BrandLogo from "../components/BrandLogo";

const HEADLINE_TYPING_TEXT = "Live and Beyond";
type MobileSliderKey = "kpi" | "workflow" | "features";

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("#hero");
  const [showSplash, setShowSplash] = useState(true);
  const [isHeaderElevated, setIsHeaderElevated] = useState(false);
  const [activeMobileSlide, setActiveMobileSlide] = useState<Record<MobileSliderKey, number>>({
    kpi: 0,
    workflow: 0,
    features: 0,
  });
  const landingVariantClass = (() => {
    const param = new URLSearchParams(window.location.search).get("lp");
    if (param === "1") return "landing-variant-01";
    if (param === "3") return "landing-variant-03";
    return "landing-variant-02";
  })();
  const [typedHeadline, setTypedHeadline] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const sliderRafRef = useRef<Partial<Record<MobileSliderKey, number>>>({});
  const lastKpiInteractionRef = useRef(0);
  const kpiSliderRef = useRef<HTMLDivElement | null>(null);
  const workflowSliderRef = useRef<HTMLDivElement | null>(null);
  const featureSliderRef = useRef<HTMLDivElement | null>(null);

  const navItems = [
    { label: "Overview", href: "#hero" },
    { label: "Features", href: "#features" },
    { label: "Workflow", href: "#workflow" },
    { label: "Security", href: "#security" },
  ];

  const workflowCards = [
    {
      step: "01",
      title: "Store Sensitive Files",
      text: "Upload wills, IDs, ownership records, and private files with client-side encryption.",
    },
    {
      step: "02",
      title: "Guardian Oversight",
      text: "You can approve access while alive, or require guardian multi-signature for emergency/inheritance release.",
    },
    {
      step: "03",
      title: "Controlled Delivery",
      text: "Authorized family members or trusted contacts access documents only under the policy you define.",
    },
  ];

  const featureCards = [
    {
      icon: <FiShield className="text-xl" />,
      title: "Access Guardians",
      description: "Assign trusted guardians and executors for each access vault.",
      points: ["Flexible approval thresholds", "On-chain audit events", "Emergency fallback coverage"],
    },
    {
      icon: <FiLock className="text-xl" />,
      title: "Encrypted Vault Storage",
      description: "Sensitive family records are encrypted in-browser before upload.",
      points: ["Client-side AES encryption", "No plaintext exposure", "IPFS-backed retrieval"],
    },
    {
      icon: <FiKey className="text-xl" />,
      title: "Access Passes",
      description: "ERC-721 passes define who can request or receive protected documents.",
      points: ["Mint to family or delegates", "Burn to revoke", "Wallet-native ownership"],
    },
  ];

  const kpiCards = [
    { title: "AES-256", subtitle: "Client-side encryption" },
    { title: "Multi-Sig", subtitle: "Guardian approvals" },
    { title: "ERC-721", subtitle: "Beneficiary access passes" },
  ];

  const securityItems = [
    {
      icon: <FiCheckCircle className="text-brand-400" />,
      title: "No Plaintext Leakage",
      description: "Only encrypted metadata and content references are placed on-chain.",
    },
    {
      icon: <FiCheckCircle className="text-brand-400" />,
      title: "Theft-Resistant Control",
      description: "No single actor can unilaterally release protected documents.",
    },
    {
      icon: <FiCheckCircle className="text-brand-400" />,
      title: "Verifiable Release Trail",
      description: "Approval actions are recorded for legal and family-level accountability.",
    },
  ];

  const navButtonClass = `button-curve group ${buttonClasses.primarySm}`;
  const solidButtonClass = `button-curve group ${buttonClasses.primaryMd}`;
  const outlineButtonClass = `button-curve group ${buttonClasses.outlineMd}`;
  const neutralButtonClass = `button-curve group ${buttonClasses.neutralMd}`;

  const headerTabClass =
    "h-9 px-4 rounded-full text-[13px] sm:text-[14px] font-semibold transition-all duration-300 inline-flex items-center";

  const refreshSliderIndex = useCallback(
    (key: MobileSliderKey, track: HTMLDivElement | null) => {
      if (!track || window.innerWidth >= 768) return;

      const slides = Array.from(track.querySelectorAll<HTMLElement>("[data-slider-item]"));
      if (slides.length === 0) return;

      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      slides.forEach((slide, idx) => {
        const distance = Math.abs(slide.offsetLeft - track.scrollLeft);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = idx;
        }
      });

      setActiveMobileSlide((previous) =>
        previous[key] === nearestIndex ? previous : { ...previous, [key]: nearestIndex }
      );
    },
    []
  );

  const handleSliderScroll = useCallback(
    (key: MobileSliderKey) => (event: UIEvent<HTMLDivElement>) => {
      if (window.innerWidth >= 768) return;
      if (key === "kpi") {
        lastKpiInteractionRef.current = Date.now();
      }

      const existingRaf = sliderRafRef.current[key];
      if (typeof existingRaf === "number") {
        window.cancelAnimationFrame(existingRaf);
      }

      const track = event.currentTarget;
      sliderRafRef.current[key] = window.requestAnimationFrame(() => {
        refreshSliderIndex(key, track);
      });
    },
    [refreshSliderIndex]
  );

  const scrollSliderToIndex = useCallback((key: MobileSliderKey, index: number) => {
    const track =
      key === "kpi"
        ? kpiSliderRef.current
        : key === "workflow"
        ? workflowSliderRef.current
        : featureSliderRef.current;
    if (!track) return;
    const slides = Array.from(track.querySelectorAll<HTMLElement>("[data-slider-item]"));
    const target = slides[index];
    if (!target) return;
    track.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
    setActiveMobileSlide((previous) => ({ ...previous, [key]: index }));
    if (key === "kpi") {
      lastKpiInteractionRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const sectionIds = ["hero", "features", "workflow", "security"];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    const setFromHash = () => {
      if (window.location.hash) {
        setActiveNav(window.location.hash);
      }
    };

    setFromHash();

    if (sections.length === 0) {
      window.addEventListener("hashchange", setFromHash);
      return () => window.removeEventListener("hashchange", setFromHash);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveNav(`#${visible.target.id}`);
        }
      },
      {
        threshold: [0.2, 0.35, 0.5, 0.7],
        rootMargin: "-28% 0px -46% 0px",
      }
    );

    sections.forEach((section) => observer.observe(section));
    window.addEventListener("hashchange", setFromHash);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", setFromHash);
    };
  }, []);

  useEffect(() => {
    if (showSplash) return;

    const revealTargets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]")
    );

    if (revealTargets.length === 0) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      revealTargets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    revealTargets.forEach((el) => {
      const delay = Number(el.dataset.revealDelay || "0");
      el.style.setProperty("--reveal-delay", `${Math.max(delay, 0)}ms`);
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    revealTargets.forEach((el) => revealObserver.observe(el));

    return () => revealObserver.disconnect();
  }, [showSplash]);

  useEffect(() => {
    if (showSplash) return;
    setTypedHeadline("");
    setIsTypingComplete(false);
  }, [showSplash]);

  useEffect(() => {
    if (showSplash) return;

    if (window.innerWidth < 768) {
      kpiSliderRef.current?.scrollTo({ left: 0, behavior: "auto" });
      workflowSliderRef.current?.scrollTo({ left: 0, behavior: "auto" });
      featureSliderRef.current?.scrollTo({ left: 0, behavior: "auto" });
      setActiveMobileSlide({ kpi: 0, workflow: 0, features: 0 });
    }

    const syncSliderState = () => {
      refreshSliderIndex("kpi", kpiSliderRef.current);
      refreshSliderIndex("workflow", workflowSliderRef.current);
      refreshSliderIndex("features", featureSliderRef.current);
    };

    syncSliderState();
    window.addEventListener("resize", syncSliderState);

    return () => {
      window.removeEventListener("resize", syncSliderState);
    };
  }, [showSplash, refreshSliderIndex]);

  useEffect(() => {
    return () => {
      Object.values(sliderRafRef.current).forEach((rafId) => {
        if (typeof rafId === "number") {
          window.cancelAnimationFrame(rafId);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (showSplash || isTypingComplete) return;
    const isComplete = typedHeadline === HEADLINE_TYPING_TEXT;

    const timer = window.setTimeout(() => {
      if (isComplete) {
        setTypedHeadline(HEADLINE_TYPING_TEXT);
        setIsTypingComplete(true);
        return;
      }

      setTypedHeadline(HEADLINE_TYPING_TEXT.slice(0, typedHeadline.length + 1));
    }, isComplete ? 120 : 18);

    return () => window.clearTimeout(timer);
  }, [showSplash, isTypingComplete, typedHeadline]);

  useEffect(() => {
    if (showSplash) return;

    const interval = window.setInterval(() => {
      if (window.innerWidth >= 768) return;
      if (Date.now() - lastKpiInteractionRef.current < 2200) return;

      setActiveMobileSlide((previous) => {
        const nextKpi = (previous.kpi + 1) % kpiCards.length;
        scrollSliderToIndex("kpi", nextKpi);
        return { ...previous, kpi: nextKpi };
      });
    }, 3200);

    return () => window.clearInterval(interval);
  }, [showSplash, kpiCards.length, scrollSliderToIndex]);

  useEffect(() => {
    if (showSplash) return;

    const onScroll = () => {
      setIsHeaderElevated(window.scrollY > 10);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, [showSplash]);

  if (showSplash) {
    return (
      <div className={`landing-splash ${landingVariantClass} min-h-screen w-full max-w-[100vw] overflow-hidden bg-gradient-to-b from-[#040306] via-gray-950 to-[#040306] text-gray-100`}>
        <div className="landing-splash__bg">
          <div className="landing-splash__blur landing-splash__blur--top" />
          <div className="landing-splash__blur landing-splash__blur--left" />
          <div className="landing-splash__blur landing-splash__blur--right" />
        </div>

        <div className="landing-splash__content">
          <div className="landing-splash__orbit">
            <div className="landing-splash__ring landing-splash__ring--outer" />
            <div className="landing-splash__ring landing-splash__ring--mid" />
            <div className="landing-splash__ring landing-splash__ring--inner" />
            <div className="landing-splash__logo-shell">
              <BrandLogo className="landing-splash__logo" />
            </div>
          </div>
          <h1 className="landing-splash__title">SpooVault</h1>
          <p className="landing-splash__subtitle">Loading secure access on Avalanche</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`landing-page landing-web3 ${landingVariantClass} flex min-h-screen flex-col w-full max-w-[100vw] overflow-x-hidden bg-gradient-to-b from-[#040306] via-gray-950 to-[#040306] text-gray-100`}>
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="landing-grid-overlay" />
        <div className="landing-scanline-overlay" />
        <div className="landing-web3-aurora landing-web3-aurora--top" />
        <div className="landing-web3-aurora landing-web3-aurora--mid" />
        <div className="landing-web3-aurora landing-web3-aurora--bottom" />
      </div>

      {isMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <div className={`landing-fixed-top md:hidden fixed inset-x-3 top-4 z-50 mx-auto max-w-[30rem]${isHeaderElevated ? " is-elevated" : ""}`}>
        <div className="relative">
          <div className="landing-mobile-header-bar w-full h-[4.5rem] rounded-2xl border border-gray-800/70 bg-gray-950/82 backdrop-blur-2xl shadow-[0_18px_36px_-26px_rgba(0,0,0,0.95)] px-4 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden" onClick={() => setIsMenuOpen(false)}>
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-gray-700/60 flex items-center justify-center shadow-lg shadow-brand-900/20 flex-shrink-0">
                <BrandLogo className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[15px] font-bold leading-none truncate">SpooVault</h1>
              </div>
            </Link>
            <button
              type="button"
              aria-label="Toggle navigation menu"
              className="w-10 h-10 rounded-xl border border-gray-700/70 bg-gray-900/75 text-gray-200 flex items-center justify-center flex-shrink-0"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              {isMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              isMenuOpen ? "max-h-[420px] opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
            }`}
          >
            <div className="landing-mobile-menu-panel w-full rounded-2xl border border-gray-800/80 bg-gray-950/95 backdrop-blur-2xl p-2 shadow-[0_22px_32px_-24px_rgba(0,0,0,0.95)]">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setActiveNav(item.href);
                      setIsMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                      activeNav === item.href
                        ? "border border-gray-700/80 bg-gray-800/80 text-white"
                        : "border border-transparent text-gray-300 hover:bg-gray-800/60 hover:text-white"
                    }`}
                  >
                    <span>{item.label}</span>
                  </a>
                ))}
              </nav>
              <div className="pt-2">
                <Link to="/dashboard" className="block w-full" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    className={`w-full ${navButtonClass}`}
                    endContent={<FiArrowRight className="text-[18px] transition-transform duration-300 group-hover:translate-x-1" />}
                  >
                    Launch App
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`landing-fixed-top hidden md:block fixed inset-x-0 top-5 z-50 px-6 lg:px-8${isHeaderElevated ? " is-elevated" : ""}`}>
        <div className="w-full max-w-7xl mx-auto">
        <Navbar
          className="landing-desktop-nav rounded-2xl border border-gray-800/70 bg-gray-950/82 backdrop-blur-2xl shadow-[0_18px_36px_-26px_rgba(0,0,0,0.95)]"
          maxWidth="full"
          height="4.5rem"
        >
        <NavbarContent justify="start" className="gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-gray-700/60 flex items-center justify-center shadow-lg shadow-brand-900/20">
              <BrandLogo className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">SpooVault</h1>
              <p className="text-[11px] text-gray-400">Avalanche Access Security</p>
            </div>
          </Link>
        </NavbarContent>

        <NavbarContent justify="center" className="hidden lg:flex">
          <div className="flex items-center gap-1.5 rounded-full border border-gray-700/70 bg-gray-900/55 p-1.5 backdrop-blur-xl">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setActiveNav(item.href)}
                className={`${headerTabClass} ${
                  activeNav === item.href
                    ? "bg-gray-800/90 border border-gray-600/65 text-gray-100 font-bold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                    : "border border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/65"
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </NavbarContent>

        <NavbarContent justify="end" className="gap-3">
          <span className="golden-button-orbit inline-flex">
            <Link to="/dashboard">
              <Button
                className={navButtonClass}
                endContent={<FiArrowRight className="text-[16px] transition-transform duration-300 group-hover:translate-x-1" />}
              >
                Launch App
              </Button>
            </Link>
          </span>
        </NavbarContent>
        </Navbar>
        </div>
      </div>
      <div className="landing-main-fade flex-1">
      <div className="h-[96px] sm:h-[104px]" aria-hidden="true" />

      <section id="hero" className="landing-section relative px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-14 sm:pb-20">
        <div className="landing-hero-stage">
        <div className="landing-hero-edge landing-hero-edge--left" />
        <div className="landing-hero-edge landing-hero-edge--right" />
        <div className="landing-hero-beam" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-start">
          <div className="landing-hero-copy reveal-on-scroll" data-reveal data-reveal-delay="40">
            <h1 className="landing-hero-title text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              <span className="landing-hero-line landing-hero-line--primary">Protect Family Documents</span>
              <span className="landing-hero-line landing-hero-line--accent text-brand-400">
                While You{" "}
                <span className="landing-typewriter" aria-live="polite">
                  {typedHeadline || " "}
                  <span className={`landing-type-caret${isTypingComplete ? " is-hidden" : ""}`} />
                </span>
              </span>
            </h1>

            <p className="landing-hero-meta mt-4 text-xs sm:text-sm text-gray-400 tracking-wide">
              Avalanche Fuji {"\u2022"} AES-256 {"\u2022"} Multi-Sig
            </p>

            <p className="landing-hero-description mt-4 text-base sm:text-lg text-gray-400 max-w-2xl leading-relaxed">
              SpooVault secures critical documents for everyday control while you&apos;re alive, with
              guardian-governed emergency and inheritance release when needed.
            </p>

            <div className="landing-hero-actions mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <span className="golden-button-orbit inline-flex w-full max-w-full sm:w-auto">
                <Link to="/dashboard" className="block w-full sm:w-auto">
                  <Button
                    className={`w-full sm:w-auto text-sm font-semibold tracking-[0.01em] ${solidButtonClass}`}
                    endContent={<FiArrowRight className="text-[16px] transition-transform duration-300 group-hover:translate-x-1" />}
                  >
                    Start Secure Vault
                  </Button>
                </Link>
              </span>
              <a href="#workflow" className="w-full sm:w-auto">
                <Button
                  className={`w-full sm:w-auto text-sm font-semibold tracking-[0.01em] !text-red-100 ${outlineButtonClass}`}
                  endContent={<FiArrowRight className="text-[16px] text-red-100 transition-transform duration-300 group-hover:translate-x-1" />}
                >
                  View Access Flow
                </Button>
              </a>
            </div>

            <div
              ref={kpiSliderRef}
              onScroll={handleSliderScroll("kpi")}
              onTouchStart={() => {
                lastKpiInteractionRef.current = Date.now();
              }}
              onMouseDown={() => {
                lastKpiInteractionRef.current = Date.now();
              }}
              className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 hero-kpi-track"
            >
              {kpiCards.map((card, idx) => (
                <div
                  key={card.title}
                  data-slider-item
                  className={`hero-kpi-item landing-card landing-kpi-card reveal-on-scroll rounded-2xl border border-gray-800 bg-gray-900/35 p-4 ${
                    activeMobileSlide.kpi === idx ? "is-active-mobile-slide" : ""
                  }`}
                  data-reveal
                  data-reveal-delay={String(140 + idx * 50)}
                >
                  <p className="text-xl font-semibold">{card.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
                </div>
              ))}
            </div>
            <div className="mobile-slider-dots" aria-label="KPI slider progress">
              {kpiCards.map((card, idx) => (
                <button
                  key={card.title}
                  type="button"
                  aria-label={`Show ${card.title} card`}
                  onClick={() => scrollSliderToIndex("kpi", idx)}
                  className={`mobile-slider-dot${activeMobileSlide.kpi === idx ? " is-active" : ""}`}
                />
              ))}
            </div>
            <p className="mobile-slider-ellipsis" aria-hidden="true">...</p>
            <p className="mobile-slider-hint">Swipe cards to view all 3 highlights</p>
          </div>

          <div className="landing-flow-panel reveal-on-scroll rounded-3xl border border-gray-800 bg-gradient-to-b from-gray-900/70 to-gray-950/90 p-5 sm:p-6 lg:max-h-[calc(100vh-8.8rem)] lg:flex lg:flex-col shadow-2xl shadow-black/30" data-reveal data-reveal-delay="100">
            <div className="mb-4">
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-400">
                <FiClock className="text-brand-400" />
                <span>Owner + Guardian Control</span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-semibold leading-tight">How Access Release Works</h2>
            <p className="text-sm text-gray-400 mt-2 mb-5">Designed for everyday sharing, emergencies, and inheritance planning.</p>

            <div
              ref={workflowSliderRef}
              onScroll={handleSliderScroll("workflow")}
              className="hero-workflow-cards landing-flow-scroll"
            >
              {workflowCards.map((card, idx) => (
                <div
                  key={card.step}
                  data-slider-item
                  className={`hero-workflow-card landing-flow-step landing-card reveal-on-scroll rounded-2xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 lg:p-4 transition-colors hover:border-brand-700/40 ${
                    activeMobileSlide.workflow === idx ? "is-active-mobile-slide" : ""
                  }`}
                  data-reveal
                  data-reveal-delay={String(200 + idx * 60)}
                >
                  <div className="w-9 h-9 rounded-xl bg-brand-700/20 border border-brand-700/40 text-brand-300 text-xs font-semibold flex items-center justify-center mb-3">
                    {card.step}
                  </div>
                  <h3 className="text-lg lg:text-[1.02rem] font-semibold mb-1">{card.title}</h3>
                  <p className="text-sm lg:text-[0.87rem] lg:leading-relaxed text-gray-400">{card.text}</p>
                </div>
              ))}
            </div>
            <div className="mobile-slider-dots" aria-label="Workflow slider progress">
              {workflowCards.map((card, idx) => (
                <button
                  key={card.step}
                  type="button"
                  aria-label={`Show workflow step ${idx + 1}`}
                  onClick={() => scrollSliderToIndex("workflow", idx)}
                  className={`mobile-slider-dot${activeMobileSlide.workflow === idx ? " is-active" : ""}`}
                />
              ))}
            </div>
            <p className="mobile-slider-ellipsis" aria-hidden="true">...</p>
            <p className="mobile-slider-hint">Swipe to review all release steps</p>
          </div>
        </div>
        </div>
      </section>

      <section id="features" className="landing-section landing-feature-section px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-y border-gray-800/50 bg-gray-950/25">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl reveal-on-scroll" data-reveal data-reveal-delay="20">
            <p className="text-sm text-brand-400 font-medium tracking-wide">CORE CAPABILITIES</p>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2">Infrastructure for Living and Inheritance Access</h2>
            <p className="text-gray-400 mt-4">
              Built to protect sensitive files, enforce approval policies, and provide a verifiable release history.
            </p>
          </div>

          <div
            ref={featureSliderRef}
            onScroll={handleSliderScroll("features")}
            className="mt-8 feature-card-track"
          >
            {featureCards.map((feature, idx) => (
              <div
                key={feature.title}
                data-slider-item
                className={`feature-card-item landing-feature-card landing-card reveal-on-scroll rounded-3xl border border-gray-800 bg-gray-900/40 p-6 ${
                  activeMobileSlide.features === idx ? "is-active-mobile-slide" : ""
                }`}
                data-reveal
                data-reveal-delay={String(70 + idx * 70)}
              >
                <div className="w-11 h-11 rounded-xl bg-brand-700/20 border border-brand-700/30 flex items-center justify-center text-brand-300 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-sm text-gray-400 mt-2">{feature.description}</p>
                <div className="mt-4 space-y-2">
                  {feature.points.map((point) => (
                    <div key={point} className="flex items-center gap-2 text-sm text-gray-300">
                      <FiCheckCircle className="text-brand-500" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mobile-slider-dots" aria-label="Feature slider progress">
            {featureCards.map((feature, idx) => (
              <button
                key={feature.title}
                type="button"
                aria-label={`Show ${feature.title} feature`}
                onClick={() => scrollSliderToIndex("features", idx)}
                className={`mobile-slider-dot${activeMobileSlide.features === idx ? " is-active" : ""}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="landing-section px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6 sm:gap-8 items-start">
          <div className="landing-card landing-workflow-card reveal-on-scroll rounded-3xl border border-gray-800 bg-gray-900/35 p-6 sm:p-8" data-reveal data-reveal-delay="30">
            <p className="text-sm text-brand-400 font-medium">WORKFLOW</p>
            <h2 className="text-3xl font-bold mt-2">Built for Real Family Continuity</h2>
            <p className="text-gray-400 mt-3">
              Control access today, set emergency rules, and ensure the right people can retrieve files later.
            </p>

            <div className="mt-6 space-y-4">
              {[
                "Create an access vault and assign trusted guardians/executors",
                "Encrypt and upload sensitive family documents",
                "Issue access passes for family or delegates",
                "Approve release requests with threshold consensus when policy conditions are met",
              ].map((item, idx) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-7 h-7 mt-0.5 rounded-lg bg-brand-700/20 border border-brand-700/40 text-brand-300 text-xs font-semibold flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <p className="text-sm sm:text-base text-gray-300">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="security" className="landing-card landing-security-card reveal-on-scroll rounded-3xl border border-gray-800 bg-gray-900/35 p-6 sm:p-8" data-reveal data-reveal-delay="80">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-brand-700/20 border border-brand-700/30 flex items-center justify-center text-brand-300">
                <FiFileText className="text-xl" />
              </div>
              <div>
                <p className="text-sm text-brand-400 font-medium">SECURITY MODEL</p>
                <h3 className="text-2xl font-semibold">Protection by Design</h3>
              </div>
            </div>
            <div className="space-y-4">
              {securityItems.map((item, idx) => (
                <div
                  key={item.title}
                  className="landing-card reveal-on-scroll rounded-2xl border border-gray-800 bg-gray-900/55 p-4"
                  data-reveal
                  data-reveal-delay={String(130 + idx * 60)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{item.icon}</div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="landing-card landing-cta-panel reveal-on-scroll max-w-5xl mx-auto rounded-3xl border border-gray-800 bg-gradient-to-r from-gray-900/80 to-gray-900/45 p-8 sm:p-10 text-center" data-reveal data-reveal-delay="20">
          <p className="text-sm text-brand-400 font-medium">READY FOR REAL-WORLD USE</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2">Deploy a Theft-Resistant Access Platform</h2>
          <p className="text-gray-400 mt-3 max-w-2xl mx-auto">
            Start with access vault creation, encrypted storage, and policy-based release for both living and inheritance scenarios.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <span className="golden-button-orbit inline-flex w-full max-w-full sm:w-auto">
              <Link to="/dashboard" className="block w-full sm:w-auto">
                <Button
                  className={`w-full sm:w-auto ${solidButtonClass}`}
                  endContent={<FiArrowRight className="text-[16px] transition-transform duration-300 group-hover:translate-x-1" />}
                >
                  Open Access Dashboard
                </Button>
              </Link>
            </span>
            <a href="#features" className="w-full sm:w-auto">
              <Button
                className={`w-full sm:w-auto ${neutralButtonClass}`}
                endContent={<FiArrowRight className="text-[16px] transition-transform duration-300 group-hover:translate-x-1" />}
              >
                Explore Capabilities
              </Button>
            </a>
          </div>
        </div>
      </section>

      </div>

      <footer className="landing-footer shrink-0 border-t border-gray-800/60 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-gray-700/60 flex items-center justify-center">
              <BrandLogo className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">SpooVault</p>
              <p className="text-[11px] text-gray-500">Secure access vault on Avalanche</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">{getCurrentYear()} SpooVault. Secure by default.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;



