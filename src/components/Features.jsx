import React, { useRef, useCallback, useMemo, useEffect } from "react";
import { GiSilverBullet } from "react-icons/gi";

// Helper: Preload video sources for smoother playback
const usePreloadVideos = (srcs) => {
  useEffect(() => {
    const videos = srcs.map((src) => {
      const video = document.createElement("video");
      video.src = src;
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      video.load();
      return video;
    });
    return () => {
      videos.forEach((video) => {
        video.src = "";
      });
    };
  }, [srcs]);
};

// Optimized BentoTilt: no unnecessary re-renders, no state, uses refs and requestAnimationFrame
const BentoTilt = React.memo(function BentoTilt({ children, className = "" }) {
  const itemRef = useRef(null);
  const frame = useRef();

  const handleMouseMove = useCallback((event) => {
    if (!itemRef.current) return;
    if (frame.current) cancelAnimationFrame(frame.current);

    frame.current = requestAnimationFrame(() => {
      const { left, top, width, height } = itemRef.current.getBoundingClientRect();
      const x = (event.clientX - left) / width;
      const y = (event.clientY - top) / height;
      const tiltX = (y - 0.5) * 5;
      const tiltY = (x - 0.5) * -5;
      itemRef.current.style.transform = `perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(.95, .95, .95)`;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!itemRef.current) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    itemRef.current.style.transform = "";
  }, []);

  return (
    <div
      ref={itemRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      tabIndex={-1}
      style={{ willChange: "transform" }}
    >
      {children}
    </div>
  );
});

// Optimized BentoCard: no unnecessary re-renders, no state, uses refs and requestAnimationFrame
const BentoCard = React.memo(function BentoCard({ src, title, description, exploreMore }) {
  const hoverButtonRef = useRef(null);
  const hoverBgRef = useRef(null);
  const opacityRef = useRef(0);
  const frame = useRef();
  const videoRef = useRef(null);

  // Attempt to force smooth playback by playing as soon as possible
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Try to play as soon as metadata is loaded
      const playVideo = () => {
        video.play().catch(() => {});
      };
      video.addEventListener("loadeddata", playVideo, { once: true });
      return () => {
        video.removeEventListener("loadeddata", playVideo);
      };
    }
  }, [src]);

  const handleMouseMove = useCallback((event) => {
    if (!hoverButtonRef.current || !hoverBgRef.current) return;
    if (frame.current) cancelAnimationFrame(frame.current);

    frame.current = requestAnimationFrame(() => {
      const rect = hoverButtonRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      hoverBgRef.current.style.background = `radial-gradient(100px circle at ${x}px ${y}px, #656fe288, #00000026)`;
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (hoverBgRef.current) {
      hoverBgRef.current.style.opacity = 1;
    }
    opacityRef.current = 1;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverBgRef.current) {
      hoverBgRef.current.style.opacity = 0;
    }
    opacityRef.current = 0;
  }, []);

  return (
    <div className="relative size-full">
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        autoPlay
        playsInline
        preload="auto"
        className="absolute left-0 top-0 size-full object-cover object-center"
        style={{
          // Try to hint browser for smooth playback
          objectFit: "cover",
          objectPosition: "center",
          // Hardware acceleration
          willChange: "transform",
          // Reduce frame drops
          backfaceVisibility: "hidden",
        }}
      />
      <div className="relative z-10 flex size-full flex-col justify-between p-5 text-blue-50">
        <div>
          <h1 className="bento-title special-font">{title}</h1>
          {description && (
            <p className="mt-3 max-w-64 text-xs md:text-base">{description}</p>
          )}
        </div>
        {exploreMore && (
          <div
            ref={hoverButtonRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="border-hsla relative flex w-fit cursor-pointer items-center gap-1 overflow-hidden rounded-full bg-black px-5 py-2 text-xs uppercase text-white/20"
            tabIndex={0}
          >
            <div
              ref={hoverBgRef}
              className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
              style={{ opacity: 0 }}
              aria-hidden="true"
            />
            <GiSilverBullet className="relative z-20" />
            <p className="relative z-20">EXPLORE MORE</p>
          </div>
        )}
      </div>
    </div>
  );
});

// Memoize feature data to avoid unnecessary re-creation
const FEATURE_DATA = [
  {
    id: 1,
    src: "videos/feature-1.mp4",
    title: <b>TRAINING MODE</b>,
    description: (
      <span className="font-circular-web">
        Improve your skills at Camp Jackal. Practice using different
        weapons and equipment, parachuting, driving, and other skills.
        Remember, practice makes perfect.
      </span>
    ),
    exploreMore: true,
    className: "border-hsla relative mb-7 h-96 w-full overflow-hidden rounded-md md:h-[65vh]"
  },
  {
    id: 2,
    src: "videos/feature-2.mp4",
    title: <b>LANDING</b>,
    description: (
      <span className="font-circular-web">
        As the plane enters the map, you are free to drop anywhere. Be
        careful though, other players may choose the same spot!
      </span>
    ),
    exploreMore: true,
    className: "bento-tilt_1 row-span-1 md:col-span-1 md:row-span-2"
  },
  {
    id: 3,
    src: "videos/feature-3.mp4",
    title: <b>BATTLEGROUNDS</b>,
    description: (
      <span className="font-circular-web">
        The battleground gives players tools to create rich and diverse
        stories. Jump into tense firefights with several expected and
        unexpected weapons, like frying pans!
      </span>
    ),
    exploreMore: true,
    className: "bento-tilt_1 row-span-1 ms-32 md:col-span-1 md:ms-0"
  },
  {
    id: 4,
    src: "videos/feature-4.mp4",
    title: <b>BLUE ZONE</b>,
    description: (
      <span className="font-circular-web">
        Never stop moving! The Battlegrounds features a shrinking Blue
        Zone that decreases your health. Make sure you don't linger..or
        you'll pay the price!
      </span>
    ),
    exploreMore: true,
    className: "bento-tilt_1 me-14 md:col-span-1 md:me-0"
  }
];

const Features = React.memo(function Features() {
  // Preload all feature videos for smooth playback
  usePreloadVideos([
    ...FEATURE_DATA.map(f => f.src),
    "videos/feature-5.mp4"
  ]);

  // Memoize sliced features for rendering
  const featureCards = useMemo(
    () =>
      FEATURE_DATA.slice(1).map((feature) => (
        <BentoTilt key={feature.id} className={feature.className}>
          <BentoCard {...feature} />
        </BentoTilt>
      )),
    []
  );

  // Ref for the last video card to force play on mount
  const lastVideoRef = useRef(null);
  useEffect(() => {
    const video = lastVideoRef.current;
    if (video) {
      const playVideo = () => {
        video.play().catch(() => {});
      };
      video.addEventListener("loadeddata", playVideo, { once: true });
      return () => {
        video.removeEventListener("loadeddata", playVideo);
      };
    }
  }, []);

  return (
    <section id="features" className="bg-black pb-52">
      <div className="container mx-auto px-3 md:px-10">
        <div className="px-5 py-32">
          <p className="font-circular-web text-lg text-blue-50">
            PREPARE FOR BATTLE
          </p>
          <p className="max-w-md font-circular-web text-lg text-blue-50 opacity-50">
            A maximum of 100 players will gather at the starting island before
            departing on a plane. Before jumping, you can open the map and pick
            your landing spot
          </p>
        </div>

        {/* Main featured card */}
        <BentoTilt className={FEATURE_DATA[0].className}>
          <BentoCard {...FEATURE_DATA[0]} />
        </BentoTilt>

        <div className="grid h-[135vh] w-full grid-cols-2 grid-rows-3 gap-7">
          {/* Feature cards 2-4 */}
          {featureCards}

          {/* Game modes card */}
          <BentoTilt className="bento-tilt_2">
            <div className="flex size-full flex-col justify-between bg-[#E7A103] p-5">
              <h1 className="bento-title special-font max-w-64 text-black">
                <b>GAME.MODES</b> SOLO <br /> DUO <br /> SQUAD
              </h1>
            </div>
          </BentoTilt>

          {/* Video card */}
          <BentoTilt className="bento-tilt_2">
            <video
              ref={lastVideoRef}
              src="videos/feature-5.mp4"
              loop
              muted
              autoPlay
              playsInline
              preload="auto"
              className="size-full object-cover object-center"
              style={{
                objectFit: "cover",
                objectPosition: "center",
                willChange: "transform",
                backfaceVisibility: "hidden",
              }}
            />
          </BentoTilt>
        </div>
      </div>
    </section>
  );
});

export default Features;