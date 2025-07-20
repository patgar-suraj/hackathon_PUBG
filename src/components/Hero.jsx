import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";
import { GiSilverBullet } from "react-icons/gi";
import { useEffect, useRef, useState } from "react";

import Button from "./Button";
import VideoPreview from "./VideoPreview";

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [hasClicked, setHasClicked] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadedVideos, setLoadedVideos] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const totalVideos = 4;
  const nextVdRef = useRef(null);
  const pubgTextRef = useRef(null);
  const gamingTextRef = useRef(null);
  const pTagRef = useRef(null);
  const buttonRef = useRef(null);
  const loadingScreenRef = useRef(null);
  const progressBarRef = useRef(null);
  const progressTextRef = useRef(null);
  const buggyImageRef = useRef(null);
  const loadingDotsRef = useRef(null);

  const handleVideoLoad = () => {
    setLoadedVideos((prev) => prev + 1);
  };

  useEffect(() => {
    if (loadedVideos === totalVideos - 1) {
      // Animate progress to 100%
      gsap.to({ progress: loadingProgress }, {
        progress: 100,
        duration: 2,
        ease: "power2.out",
        onUpdate: function() {
          const currentProgress = Math.round(this.targets()[0].progress);
          setLoadingProgress(currentProgress);
          
          // Update progress bar width
          if (progressBarRef.current) {
            gsap.set(progressBarRef.current, {
              width: `${currentProgress}%`
            });
          }
          
          // ✅ Fixed: Move buggy along bar with real calculation
          if (buggyImageRef.current) {
            const barWidth = 800; // px
            const buggyWidth = 32; // w-8 = 2rem = 32px
            gsap.set(buggyImageRef.current, {
              x: `${(barWidth - buggyWidth) * (currentProgress / 100)}px`
            });
          }
          
          // Update progress text
          if (progressTextRef.current) {
            progressTextRef.current.textContent = `${currentProgress}%`;
          }
        },
        onComplete: () => {
          // Hide loading screen after buggy reaches end
          setTimeout(() => {
            hideLoadingScreen();
          }, 400);
        }
      });
    }
  }, [loadedVideos]);

  const hideLoadingScreen = () => {
    const tl = gsap.timeline();
    
    // Fade out loading elements
    tl.to([buggyImageRef.current, progressBarRef.current, progressTextRef.current, loadingDotsRef.current], {
      opacity: 0,
      duration: 0.5,
      ease: "power2.out"
    })
    // Scale up and fade out the entire loading screen
    .to(loadingScreenRef.current, {
      scale: 1.2,
      opacity: 0,
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: () => {
        setLoading(false);
      }
    });
  };

  const handleMiniVdClick = () => {
    setHasClicked(true);
    setCurrentIndex((prevIndex) => (prevIndex % totalVideos) + 1);
  };

  const createTextPrintingAnimation = (element, finalText, delay = 0) => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const timeline = gsap.timeline({ delay });
    
    finalText.split("").forEach((char, index) => {
      if (char === " ") return;
      const targetIndex = letters.indexOf(char);
      if (targetIndex === -1) return;
      
      for (let i = 0; i <= targetIndex; i++) {
        timeline.to(element, {
          duration: 0.05,
          ease: "none",
          onComplete: () => {
            const currentText = element.textContent;
            const newText = currentText.substring(0, index) + letters[i] + currentText.substring(index + 1);
            element.textContent = newText;
          }
        });
      }
      timeline.to({}, { duration: 0.1 });
    });
    return timeline;
  };

  const createLetterByLetterAnimation = (element, text, delay = 0) => {
    const timeline = gsap.timeline({ delay });
    element.textContent = "".repeat(text.length);
    text.split("").forEach((char, index) => {
      timeline.to(element, {
        duration: 0.08,
        ease: "none",
        onComplete: () => {
          const currentText = element.textContent;
          const newText = currentText.substring(0, index) + char + currentText.substring(index + 1);
          element.textContent = newText;
        }
      });
      timeline.to({}, { duration: 0.05 });
    });
    return timeline;
  };

  const createWordByWordAnimation = (element, text, delay = 0) => {
    const words = text.split(" ");
    const timeline = gsap.timeline({ delay });
    element.textContent = "";
    words.forEach((word, index) => {
      timeline.to(element, {
        duration: 0.1,
        ease: "none",
        onComplete: () => {
          const currentText = element.textContent;
          element.textContent = currentText + (index > 0 ? " " : "") + word;
        }
      });
      timeline.to({}, { duration: 0.3 });
    });
    return timeline;
  };

  useGSAP(() => {
    if (loading && buggyImageRef.current && loadingDotsRef.current) {
      gsap.fromTo(buggyImageRef.current, 
        { scale: 0 },
        { 
          scale: 1,
          duration: 1.5,
          ease: "back.out(1.7)",
          delay: 0
        }
      );
      gsap.fromTo(loadingDotsRef.current.children,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 1.5,
          stagger: 0.1,
          delay: 1,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut"
        }
      );
      if (progressBarRef.current) {
        gsap.set(progressBarRef.current, {
          width: "0%"
        });
      }
    }
  }, [loading]);

  useGSAP(() => {
    if (hasClicked) {
      gsap.set("#next-video", { visibility: "visible" });
      gsap.to("#next-video", {
        transformOrigin: "center center",
        scale: 1,
        width: "100%",
        height: "100%",
        duration: 1,
        ease: "power1.inOut",
        onStart: () => nextVdRef.current.play(),
      });
      gsap.from("#current-video", {
        transformOrigin: "center center",
        scale: 0,
        duration: 1.5,
        ease: "power1.inOut",
      });
    }
  }, {
    dependencies: [currentIndex],
    revertOnUpdate: true,
  });

  useGSAP(() => {
    gsap.set("#video-frame", {
      clipPath: "polygon(10% 0%, 82% 0%, 86% 90%, 5% 80%)",
      borderRadius: "0, 0, 0, 0"
    });
    gsap.from("#video-frame", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: "#video-frame",
        start: "center center",
        end: "bottom center",
        scrub: true,
      },
    });
  });

  useGSAP(() => {
    if (!loading && pubgTextRef.current && gamingTextRef.current && pTagRef.current && buttonRef.current) {
      gsap.set(buttonRef.current, { x: -200, opacity: 0 });
      pubgTextRef.current.textContent = "....";
      gamingTextRef.current.textContent = "......";
      pTagRef.current.textContent = "";
      const masterTimeline = gsap.timeline({ delay: 0.5 });
      masterTimeline.add(createTextPrintingAnimation(pubgTextRef.current, "BGMI"), 0);
      masterTimeline.add(createTextPrintingAnimation(gamingTextRef.current, "GAMING"), 0.9);
      masterTimeline.add(createLetterByLetterAnimation(pTagRef.current, "Enter the Battleground. Be the Last Standing."), 0);
      masterTimeline.to(buttonRef.current, {
        x: 0,
        opacity: 1,
        duration: 0.3,
        ease: "power2.out"
      }, 6);
    }
  }, [loading]);

  // Fix: Use import.meta.env.BASE_URL to ensure correct path for Vite static assets
  const getVideoSrc = (index) => {
    // Ensure leading slash for BASE_URL if not present
    let base = import.meta.env.BASE_URL || "/";
    if (!base.endsWith("/")) base += "/";
    return `${base}videos/hero-${index}.mp4`;
  };

  return (
    <div id="home" className="relative h-dvh w-screen overflow-x-hidden">
      {loading && (
        <div 
          ref={loadingScreenRef}
          className="flex-center absolute z-[100] h-dvh w-screen overflow-hidden bg-gradient-to-br"
        >
          <img src="img/loading2.jpg" alt="loading" className="absolute top-0 left-0 w-full h-screen object-cover" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-repeat opacity-20" 
                 style={{
                   backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
                   backgroundSize: '20px 20px'
                 }}>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center space-y-12">
            <div className="relative">
              <div className="w-[350px] lg:w-[800px] h-2 bg-white/20 rounded-full relative overflow-hidden">
                <div 
                  ref={progressBarRef}
                  className="h-full bg-gray-300 rounded-full transition-all duration-100"
                  style={{ boxShadow: '0 0 20px rgba(255, 165, 0, 0.6)' }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
              </div>
              <div 
                ref={buggyImageRef}
                className="absolute -top-6 -left-4 transition-transform duration-100"
              >
                <img 
                  src="img/buggy.png" 
                  alt="buggy" 
                  className="w-12 h-12 object-contain drop-shadow-lg"
                />
              </div>
              <div className="absolute -bottom-6 w-full flex justify-between text-xs text-white/60">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="text-center">
              <div 
                ref={progressTextRef}
                className="text-3xl font-bold text-white drop-shadow-lg mb-2"
              >
                {loadingProgress}%
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold font-circular-web text-white mb-2 drop-shadow-lg">
                  LOADING...
                </h2>
                <div 
                  ref={loadingDotsRef}
                  className="flex space-x-2 justify-center"
                >
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        id="video-frame"
        className="relative z-10 h-dvh w-screen overflow-hidden rounded-lg bg-blue-75 "
      >
        <div>
          <div className="mask-clip-path absolute-center absolute z-50 size-64 cursor-pointer overflow-hidden rounded-lg">
            <VideoPreview>
              <div
                onClick={handleMiniVdClick}
                className="origin-center scale-50 opacity-0 transition-all duration-500 ease-in hover:scale-100 hover:opacity-100"
              >
                <video
                  ref={nextVdRef}
                  src={getVideoSrc((currentIndex % totalVideos) + 1)}
                  loop
                  muted
                  id="current-video"
                  className="size-64 origin-center scale-150 object-cover object-center"
                  onLoadedData={handleVideoLoad}
                />
              </div>
            </VideoPreview>
          </div>

          <video
            ref={nextVdRef}
            src={getVideoSrc(currentIndex)}
            loop
            muted
            id="next-video"
            className="absolute-center invisible absolute z-20 size-64 object-cover object-center"
            onLoadedData={handleVideoLoad}
          />
          <video
            src={getVideoSrc(
              currentIndex === totalVideos - 1 ? 1 : currentIndex
            )}
            autoPlay
            loop
            muted
            className="absolute left-0 top-0 size-full object-cover object-center"
            onLoadedData={handleVideoLoad}
          />
        </div>

        <h1 className="special-font hero-heading absolute bottom-5 right-5 z-40 text-blue-75">
          <span ref={gamingTextRef}>G<b>A</b>MING</span>
        </h1>

        <div className="absolute left-0 top-0 z-40 size-full">
          <div className="mt-24 px-5 sm:px-10">
            <h1 className="special-font hero-heading text-blue-100 ">
              <b ref={pubgTextRef}>BGMI</b>
            </h1>

            <p ref={pTagRef} className="mb-5 max-w-64 font-robert-regular md:text-2xl text-[#E1A81E]">
              Enter the Battleground. Be the Last Standing.
            </p>

            <div ref={buttonRef}>
              <Button
                id="watch-trailer"
                title="Download Now"
                leftIcon={<GiSilverBullet />}
                containerClass="flex-center gap-1 bg-white hover:bg-[#E1A81E]"
              />
            </div>
          </div>
        </div>
      </div>

      <h1 className="special-font hero-heading absolute bottom-5 right-5 text-black">
        G<b>A</b>MING
      </h1>
    </div>
  );
};

export default Hero;
