import React, { useMemo, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { weaponCategories, gunsData } from './GunsData';

// GunCard component with GSAP animation on hover and mouse move
const GunCard = ({ gun, isActive }) => {
  const cardRef = useRef(null);
  const imgRef = useRef(null);

  // Mouse move effect: tilt and slight move (only on desktop)
  const handleMouseMove = (e) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * 10;
    const rotateX = -((y - centerY) / centerY) * 10;
    gsap.to(card, {
      rotateY,
      rotateX,
      duration: 0.3,
      ease: "power2.out"
    });
    if (imgRef.current) {
      gsap.to(imgRef.current, {
        x: (x - centerX) * 0.03,
        y: (y - centerY) * 0.03,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  const handleMouseEnter = () => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const card = cardRef.current;
    gsap.to(card, {
      duration: 0.25,
      ease: "power2.out"
    });
    if (imgRef.current) {
      gsap.to(imgRef.current, {
        scale: 1.08,
        duration: 0.25,
        ease: "power2.out"
      });
    }
  };

  const handleMouseLeave = () => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const card = cardRef.current;
    gsap.to(card, {
      rotateY: 0,
      rotateX: 0,
      scale: 1,
      boxShadow: "0 0px 0px 0 rgba(0,0,0,0)",
      duration: 0.4,
      ease: "power2.out"
    });
    if (imgRef.current) {
      gsap.to(imgRef.current, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: "power2.out"
      });
    }
  };

  return (
    <div
      ref={cardRef}
      className={`relative group w-full max-w-[470px] mb-8 cursor-pointer transition-all mx-auto sm:w-[350px] md:w-[400px] lg:w-[470px] ${isActive ? '' : 'opacity-60 pointer-events-none'}`}
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
    >
      <img src="/img/785fc5b.webp" alt="bg" className='object-contain pointer-events-none select-none w-full h-auto' loading="lazy" />
      <img
        ref={imgRef}
        src={gun.img}
        alt={gun.name}
        className='absolute top-0 left-0 w-full max-w-[500px] pointer-events-none select-none'
        loading="lazy"
        style={{ willChange: "transform" }}
      />
      <span className='absolute top-0 left-0 text-[#171513] font-circular-web text-base sm:text-lg md:text-xl ml-2 sm:ml-3 md:ml-5 mt-1'>{gun.category}</span>
      <h1 className='group-hover:text-[#E49906] absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 text-[#636265] text-2xl sm:text-3xl md:text-4xl font-circular-web text-center w-full px-2'>{gun.name}</h1>
    </div>
  );
};

const isMobileOrTablet = () => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 1024;
};

const Guns = () => {
  const [selectedCategory, setSelectedCategory] = useState(weaponCategories[0]);
  const [prevCategory, setPrevCategory] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevGunsRef = useRef(null);
  const newGunsRef = useRef(null);

  // For swipeable carousel on mobile/tablet
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Filtered guns for the selected category
  const filteredGuns = useMemo(() => {
    return gunsData.filter(gun => gun.category === selectedCategory);
  }, [selectedCategory]);

  // Filtered guns for the previous category (for animation)
  const prevFilteredGuns = useMemo(() => {
    if (!prevCategory) return [];
    return gunsData.filter(gun => gun.category === prevCategory);
  }, [prevCategory]);

  // Handle category tab click
  const handleCategoryClick = (cat) => {
    if (cat === selectedCategory || isAnimating) return;
    setPrevCategory(selectedCategory);
    setIsAnimating(true);
    if (prevGunsRef.current && newGunsRef.current) {
      gsap.to(prevGunsRef.current, {
        x: '-100%',
        opacity: 0.5,
        duration: 0.5,
        ease: "power2.inOut"
      });
      gsap.set(newGunsRef.current, { x: '100%', opacity: 0.5 });
    }
    setTimeout(() => {
      setSelectedCategory(cat);
      setActiveIndex(0); // Reset carousel index on category change
    }, 20);
  };

  React.useEffect(() => {
    if (!isAnimating) return;
    if (newGunsRef.current) {
      gsap.fromTo(
        newGunsRef.current,
        { x: '100%', opacity: 0.5 },
        {
          x: '0%',
          opacity: 1,
          duration: 0.5,
          ease: "power2.inOut",
          onComplete: () => {
            setPrevCategory(null);
            setIsAnimating(false);
          }
        }
      );
    }
  }, [selectedCategory, isAnimating]);

  // Memoize the category tabs
  const categoryTabs = useMemo(() => (
    <div className="flex flex-wrap justify-center gap-4">
      {weaponCategories.map(cat => (
        <h2
          key={cat}
          className={`text-white text-2xl sm:text-3xl md:text-4xl font-circular-web hover:text-[#E49906] cursor-pointer transition-colors duration-200 ${cat === selectedCategory ? '!text-[#E1A81E]' : ''}`}
          onClick={() => handleCategoryClick(cat)}
        >
          {cat}
        </h2>
      ))}
    </div>
  ), [selectedCategory, isAnimating]);

  // --- Swipe Handlers for Mobile/Tablet ---
  const handleTouchStart = useCallback((e) => {
    if (!isMobileOrTablet()) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchEndX.current = null;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isMobileOrTablet()) return;
    const touch = e.touches[0];
    touchEndX.current = touch.clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isMobileOrTablet()) return;
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const threshold = 50; // px
    if (distance > threshold && activeIndex < filteredGuns.length - 1) {
      setActiveIndex(idx => Math.min(idx + 1, filteredGuns.length - 1));
    } else if (distance < -threshold && activeIndex > 0) {
      setActiveIndex(idx => Math.max(idx - 1, 0));
    }
    touchStartX.current = null;
    touchEndX.current = null;
  }, [activeIndex, filteredGuns.length]);

  // Keyboard arrow navigation for accessibility (mobile/tablet)
  const handleKeyDown = useCallback((e) => {
    if (!isMobileOrTablet()) return;
    if (e.key === "ArrowLeft" && activeIndex > 0) {
      setActiveIndex(idx => Math.max(idx - 1, 0));
    } else if (e.key === "ArrowRight" && activeIndex < filteredGuns.length - 1) {
      setActiveIndex(idx => Math.min(idx + 1, filteredGuns.length - 1));
    }
  }, [activeIndex, filteredGuns.length]);

  // --- Layout Fixes Start ---
  // Remove w-screen and h-screen to prevent overflow and layout issues.
  // Use relative, px, and max-w for centering and spacing.
  // Add py-8 for vertical spacing, and responsive max-w for content.
  // The background image is absolutely positioned but contained by a relative parent.
  // --- Layout Fixes End ---

  // Responsive: show grid on desktop, carousel on mobile/tablet
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 1024 : false;

  return (
    <section className='relative w-full max-w-[1800px] mx-auto px-2 sm:px-4 md:px-8 lg:px-10 py-8 pb-16'>
      {/* bg image */}
      <img
        src="/img/weaponbg.webp"
        alt="weaponbg"
        className='absolute top-0 left-1/2 -translate-x-1/2 object-contain z-[-10] w-full max-w-[1800px] h-auto pointer-events-none select-none'
        loading="lazy"
        aria-hidden="true"
        style={{ minHeight: 400 }}
      />
      {/* text */}
      <div className='w-full'>
        <div className='w-full top-0 left-0 p-2 sm:p-4 md:p-5 z-10'>
          <h1 className='text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-bold font-circular-web text-center text-[#E49906] leading-tight'>WEAPONS</h1>
        </div>

        <div className='w-full flex flex-wrap justify-center items-center py-6 md:py-10 cursor-pointer lg:gap-10 sm:gap-6'>
          {categoryTabs}
        </div>

        {/* Animated guns-container */}
        <div className='w-full relative min-h-[400px] sm:min-h-[500px] md:min-h-[600px] pb-12'>
          {/* Desktop/tablet grid */}
          <div
            ref={newGunsRef}
            className={`hidden lg:grid absolute top-0 left-0 w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center`}
            style={{ zIndex: 2 }}
          >
            {filteredGuns.map(gun => (
              <GunCard key={gun.name} gun={gun} isActive={true} />
            ))}
          </div>
          {/* Previous guns grid (slides out left) for desktop/tablet */}
          {isAnimating && prevCategory && (
            <div
              ref={prevGunsRef}
              className='hidden lg:grid absolute top-0 left-0 w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center'
              style={{ zIndex: 1 }}
            >
              {prevFilteredGuns.map(gun => (
                <GunCard key={gun.name} gun={gun} isActive={true} />
              ))}
            </div>
          )}

          {/* Mobile/Tablet Carousel */}
          <div
            className="lg:hidden flex flex-col items-center justify-center w-full h-full pb-10"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            style={{ outline: "none", minHeight: 400 }}
          >
            {filteredGuns.length > 0 && (
              <div className="relative w-full flex items-center justify-center">
                {/* Left arrow */}
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 rounded-full p-2 text-white text-2xl focus:outline-none"
                  style={{ visibility: activeIndex > 0 ? "visible" : "hidden" }}
                  onClick={() => setActiveIndex(idx => Math.max(idx - 1, 0))}
                  aria-label="Previous weapon"
                  tabIndex={0}
                >
                  &#8592;
                </button>
                {/* GunCard */}
                <div className="w-full max-w-[470px] mx-auto">
                  <GunCard gun={filteredGuns[activeIndex]} isActive={true} />
                </div>
                {/* Right arrow */}
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 rounded-full p-2 text-white text-2xl focus:outline-none"
                  style={{ visibility: activeIndex < filteredGuns.length - 1 ? "visible" : "hidden" }}
                  onClick={() => setActiveIndex(idx => Math.min(idx + 1, filteredGuns.length - 1))}
                  aria-label="Next weapon"
                  tabIndex={0}
                >
                  &#8594;
                </button>
              </div>
            )}
            {/* Dots indicator */}
            <div className="flex justify-center mt-4 gap-2">
              {filteredGuns.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-3 h-3 rounded-full ${idx === activeIndex ? 'bg-[#E49906]' : 'bg-gray-400'} transition-colors`}
                  style={{ outline: "none", border: "none" }}
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Go to weapon ${idx + 1}`}
                  tabIndex={0}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Guns;