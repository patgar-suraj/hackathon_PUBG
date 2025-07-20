import clsx from "clsx";
import gsap from "gsap";
import { useWindowScroll } from "react-use";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { GiSupersonicBullet } from "react-icons/gi";
import Button from "./Button";

// Move NAV_ITEMS outside of component and do NOT use hooks at top-level
const NAV_ITEMS = ["Home", "About", "Features", "Inventory", "Contact"];

// Extract showDesktopNav logic to a custom hook to avoid using hooks inside render
function useShowDesktopNav() {
  const [showDesktopNav, setShowDesktopNav] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );

  useEffect(() => {
    function handleResize() {
      setShowDesktopNav(window.innerWidth >= 768);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return showDesktopNav;
}

const NavBar = () => {
  // State
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isIndicatorActive, setIsIndicatorActive] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Refs
  const audioElementRef = useRef(null);
  const navContainerRef = useRef(null);
  const logoRef = useRef(null);
  const navItemsRef = useRef([]);
  const audioButtonRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);

  // Scroll
  const { y: currentScrollY } = useWindowScroll();

  // Handlers (memoized)
  const toggleAudioIndicator = useCallback(() => {
    setIsAudioPlaying((prev) => !prev);
    setIsIndicatorActive((prev) => !prev);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  // Initial animation on mount
  useEffect(() => {
    // Defensive: filter out nulls
    const navRefs = [logoRef.current, ...navItemsRef.current, audioButtonRef.current, mobileMenuButtonRef.current].filter(Boolean);
    gsap.set(navRefs, { x: -100, opacity: 0 });

    const tl = gsap.timeline();
    tl.to(logoRef.current, {
      x: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power2.out"
    }, 4)
      .to(navItemsRef.current.filter(Boolean), {
        x: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.1
      }, "<")
      .to([audioButtonRef.current, mobileMenuButtonRef.current].filter(Boolean), {
        x: 0,
        opacity: 1,
        duration: 1.0,
        ease: "power2.out"
      }, "<");
  }, []);

  // Manage audio playback
  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;
    if (isAudioPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [isAudioPlaying]);

  // Navbar show/hide on scroll
  useEffect(() => {
    if (!navContainerRef.current) return;
    if (currentScrollY === 0) {
      setIsNavVisible(true);
      navContainerRef.current.classList.remove("floating-nav");
    } else if (currentScrollY > lastScrollY) {
      setIsNavVisible(false);
      navContainerRef.current.classList.add("floating-nav");
    } else if (currentScrollY < lastScrollY) {
      setIsNavVisible(true);
      navContainerRef.current.classList.add("floating-nav");
    }
    setLastScrollY(currentScrollY);
  }, [currentScrollY, lastScrollY]);

  // Animate navbar slide in/out
  useEffect(() => {
    if (!navContainerRef.current) return;
    gsap.to(navContainerRef.current, {
      y: isNavVisible ? 0 : -100,
      opacity: isNavVisible ? 1 : 0,
      duration: 0.2,
      overwrite: "auto"
    });
  }, [isNavVisible]);

  // Memoized nav items for rendering (not strictly needed, but safe)
  const navLinks = useMemo(() => NAV_ITEMS, []);

  // Desktop nav visibility (moved out of render)
  const showDesktopNav = useShowDesktopNav();

  return (
    <div
      ref={navContainerRef}
      className={clsx(
        "fixed left-0 right-0 top-4 z-50 transition-all duration-700 mx-10",
      )}
      style={{
        // Glass effect: semi-transparent, blur, border, subtle shadow
        background: "rgba(20, 24, 40, 0.55)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderRadius: "18px",
        border: "1.5px solid rgba(255,255,255,0.13)",
        boxShadow: "0 4px 32px 0 rgba(0,0,0,0.12)",
      }}
    >
      <header className="w-full">
        <nav className="flex w-full h-16 items-center justify-between p-4 rounded-lg">
          {/* Logo */}
          <div className="flex items-center gap-7">
            <img
              ref={logoRef}
              src="/img/bgmilogo.png"
              alt="logo"
              className="w-[100px] h-auto"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="w-full flex items-center justify-end gap-6">
            {/* Desktop Navigation Links */}
            {/* Responsive Desktop Navigation Links */}
            {showDesktopNav && (
              <div className="flex items-center gap-3">
                {navLinks.map((item, index) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    ref={el => (navItemsRef.current[index] = el)}
                    style={{ display: "inline-block" }}
                    tabIndex={0}
                  >
                    <Button
                      bullet={<GiSupersonicBullet />}
                      title={item}
                      containerClass="bg-blue-50 px-4 py-2 rounded-lg hover:bg-yellow-400 transition-all duration-200 flex items-center gap-2"
                    />
                  </a>
                ))}
              </div>
            )}
            {/* Right side - Audio button and Mobile menu button */}
            <div className="flex items-center gap-4">
              {/* Audio Button */}
              <button
                ref={audioButtonRef}
                onClick={toggleAudioIndicator}
                className="flex items-center space-x-0.5"
                aria-label="Toggle audio"
                type="button"
              >
                <audio
                  ref={audioElementRef}
                  className="hidden"
                  src="/audio/loop.mp3"
                  loop
                />
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={clsx("indicator-line", {
                      active: isIndicatorActive,
                    })}
                    style={{
                      animationDelay: `${bar * 0.1}s`,
                    }}
                  />
                ))}
              </button>
              {/* Mobile menu button */}
              <button
                ref={mobileMenuButtonRef}
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-md bg-blue-50 hover:bg-yellow-400 transition-colors duration-200"
                aria-label="Toggle mobile menu"
                type="button"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </nav>
        {/* Mobile Menu */}
        <div
          className={clsx(
            "md:hidden mt-2 bg-black/55 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden transition-all duration-300",
            isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="p-4 space-y-3">
            {navLinks.map((item, idx) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full"
                ref={el => (navItemsRef.current[idx + navLinks.length] = el)}
                tabIndex={0}
                style={{ display: "block" }}
              >
                <Button
                  bullet={<GiSupersonicBullet />}
                  title={item}
                  containerClass="bg-blue-50 w-full px-4 py-2 rounded-lg hover:bg-yellow-400 transition-all duration-200 flex items-center gap-2 justify-center"
                />
              </a>
            ))}
          </div>
        </div>
      </header>
    </div>
  );
};

export default NavBar;