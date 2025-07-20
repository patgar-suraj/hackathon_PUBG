import React from "react";
import { useEffect, useRef, useCallback, useMemo } from "react";
import { gsap } from "gsap";
import AnimatedTitle from "./AnimatedTitle";
import Button from "./Button";

// Memoized image data for rendering
const IMAGE_DATA = [
  {
    src: "/img/pan.webp",
    clipClass: "contact-clip-path-1",
    containerClass: "absolute -left-20 opacity-0 md:opacity-100 top-0 h-full w-72 overflow-hidden lg:left-20 lg:w-96",
    idx: 0,
  },
  {
    src: "/img/traning.webp",
    clipClass: "contact-clip-path-2 lg:translate-y-40 translate-y-60",
    containerClass: null,
    idx: 1,
  },
  {
    src: "/img/victor.webp",
    clipClass: "victor-clip-path md:scale-125",
    containerClass: "absolute -top-40 left-20 w-60 sm:top-1/2 md:left-auto md:right-10 lg:top-20 lg:w-80",
    idx: 2,
  },
];

// Optimized ImageClipBox with React.forwardRef
const ImageClipBox = React.forwardRef(({ src, clipClass }, ref) => (
  <div ref={ref}>
    <div className={clipClass}>
      <img src={src} loading="lazy" decoding="async" alt="" />
    </div>
  </div>
));

const Contact = () => {
  const containerRef = useRef(null);
  // Use a fixed-length array for refs to avoid unnecessary re-renders
  const imageRefs = useRef([null, null, null]);

  // Memoize event handlers for optimal performance
  const handleMouseMove = useCallback((e) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate tilt values (normalized to -1 to 1)
    const tiltX = ((y - rect.height / 2) / rect.height) * 2;
    const tiltY = ((rect.width / 2 - x) / rect.width) * 2;

    // Only animate refs that exist
    const targets = imageRefs.current.filter(Boolean);
    if (targets.length) {
      gsap.to(targets, {
        duration: 0.3,
        rotationX: tiltX * 15,
        rotationY: tiltY * 15,
        transformPerspective: 1000,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const targets = imageRefs.current.filter(Boolean);
    if (targets.length) {
      gsap.to(targets, {
        duration: 0.5,
        rotationX: 0,
        rotationY: 0,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use passive listeners for better performance
    container.addEventListener("mousemove", handleMouseMove, { passive: true });
    container.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  // Memoize AnimatedTitle props for optimal rendering
  const animatedTitleProps = useMemo(() => ({
    title:
      "IT&#39;S N<b>O</b>T JUST <b>A</b> <br /> <b>'GAME'</b> <br /> IT&#39;S <b>A</b>N <b>'EMOTION'</b>.",
    className:
      "special-font !md:text-[6.2rem] w-full font-pubg !text-5xl !font-black !leading-[.9]",
  }), []);

  return (
    <div id="contact" className="relative my-20 min-h-96 w-screen px-10 bg-[#E49906]">
      <img src="/img/char_bg.webp" alt="appBg" className="absolute top-0 left-0 w-full h-full object-cover" />
      <div
        ref={containerRef}
        className="relative rounded-lg py-24 text-blue-50 sm:overflow-hidden"
      >
        {/* Left images */}
        <div className={IMAGE_DATA[0].containerClass}>
          <ImageClipBox
            ref={el => (imageRefs.current[0] = el)}
            src={IMAGE_DATA[0].src}
            clipClass={IMAGE_DATA[0].clipClass}
          />
          <ImageClipBox
            ref={el => (imageRefs.current[1] = el)}
            src={IMAGE_DATA[1].src}
            clipClass={IMAGE_DATA[1].clipClass}
          />
        </div>
        {/* Right/top image */}
        <div className={IMAGE_DATA[2].containerClass}>
          <ImageClipBox
            ref={el => (imageRefs.current[2] = el)}
            src={IMAGE_DATA[2].src}
            clipClass={IMAGE_DATA[2].clipClass}
          />
        </div>
        {/* Content */}
        <div className="flex flex-col items-center text-center">
          <p className="mb-10 font-general text-[16px] uppercase">
            Join BGMI
          </p>
          <AnimatedTitle {...animatedTitleProps} />
          <Button title="contact us" containerClass="mt-10 cursor-pointer hover:bg-[#E49906]" />
        </div>
      </div>
    </div>
  );
};

export default Contact;