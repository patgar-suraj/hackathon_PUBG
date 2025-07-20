import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import AnimatedTitle from "./AnimatedTitle";

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  useLayoutEffect(() => {
    // Clip path animation
    const clipTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: "#clip",
        start: "center center",
        end: "+=800 center",
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
      },
    });

    clipTimeline.to(".mask-clip-path", {
      width: "100vw",
      height: "100vh",
      borderRadius: 0,
      overwrite: "auto",
    });

    // Fade in/out for subtext p tags
    const fadeLines = gsap.utils.toArray(".fadeLine");
    fadeLines.forEach((el) => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 30 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 95%",
            end: "top 30%",
            toggleActions: "play reverse play reverse",
          },
          overwrite: "auto",
        }
      );
    });

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      clipTimeline.kill();
      gsap.killTweensOf(fadeLines);
    };
  }, []);

  return (
    <section id="about" className="min-h-screen w-screen">
      <div className="relative mb-8 mt-36 flex flex-col items-center gap-5">
        <p className="welcomeTage font-general text-sm uppercase md:text-[16px]">
          Welcome to BATTLEGROUNDS
        </p>

        <AnimatedTitle
          title="Disc<b>o</b>ver the world's <br /> largest shared <b>a</b>dventure"
          containerClass="mt-5 !text-black text-center"
        />

        <div className="about-subtext">
          <p>
            BGMI: BATTLEGROUNDS is a battle royale that pits 100 players against
            each other.
          </p>
          <p className="fadeLine text-gray-500">
            Players will land, loot, and survive in a shrinking battleground as
            they outplay their opponents to become the lone survivor.
          </p>
        </div>
      </div>

      <div className="h-dvh w-screen" id="clip">
        <div className="mask-clip-path about-video">
          <video
            src="videos/about-video.mp4"
            className="absolute left-0 top-0 size-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
      </div>
    </section>
  );
};

export default About;
