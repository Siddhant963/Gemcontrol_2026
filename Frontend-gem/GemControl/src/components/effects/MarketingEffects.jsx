import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./marketingEffects.css";

gsap.registerPlugin(ScrollTrigger);

const GOLD_SHADES = ["#f6e3b4", "#e0c298", "#d4af37", "#fff3cf"];

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Golden sparkle trail that follows the cursor (and bursts on click).
function useSparkleTrail() {
  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) return undefined;

    let last = 0;
    let lastX = 0;
    let lastY = 0;

    const spawn = (x, y) => {
      const el = document.createElement("span");
      el.className = "rs-sparkle";
      const size = gsap.utils.random(4, 14);
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.background = gsap.utils.random(GOLD_SHADES);
      document.body.appendChild(el);
      gsap.fromTo(
        el,
        { x, y, scale: 0, opacity: 1, rotate: gsap.utils.random(0, 90) },
        {
          x: x + gsap.utils.random(-45, 45),
          y: y + gsap.utils.random(10, 70),
          scale: 1,
          rotate: "+=180",
          opacity: 0,
          duration: gsap.utils.random(0.8, 1.5),
          ease: "power2.out",
          onComplete: () => el.remove(),
        }
      );
    };

    const onMove = (e) => {
      const now = performance.now();
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      if (now - last < 16 || dist < 3) return;
      last = now;
      lastX = e.clientX;
      lastY = e.clientY;
      // Several sparkles per move, more when the cursor moves fast.
      const count = Math.min(5, 2 + Math.floor(dist / 25));
      for (let i = 0; i < count; i += 1) {
        spawn(e.clientX + gsap.utils.random(-8, 8), e.clientY + gsap.utils.random(-8, 8));
      }
    };
    const onClick = (e) => {
      for (let i = 0; i < 24; i += 1) spawn(e.clientX, e.clientY);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      document.querySelectorAll(".rs-sparkle").forEach((n) => n.remove());
    };
  }, []);
}

// Slide/fade blocks in as they enter the viewport and back out when scrolling up.
function useScrollAnimations(pathname) {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    let ctx;
    // Wait a tick so the page's own content has mounted.
    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
        gsap.utils.toArray("main section").forEach((section) => {
          const inner = section.firstElementChild || section;
          const targets = [];
          Array.from(inner.children).forEach((child) => {
            const display = getComputedStyle(child).display;
            const kids = Array.from(child.children);
            if ((display === "grid" || display === "flex") && kids.length > 1) {
              targets.push(...kids);
            } else {
              targets.push(child);
            }
          });
          targets.forEach((el, i) => {
            const fromX = i % 3 === 0 ? 0 : i % 2 === 0 ? 60 : -60;
            gsap.fromTo(
              el,
              { autoAlpha: 0, y: fromX === 0 ? 50 : 24, x: fromX },
              {
                autoAlpha: 1,
                y: 0,
                x: 0,
                duration: 0.9,
                ease: "power3.out",
                delay: (i % 4) * 0.08,
                scrollTrigger: {
                  trigger: el,
                  start: "top 90%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          });
        });

        // Glass orbs drift with scroll for depth behind the glass panels.
        gsap.utils.toArray(".rs-orb").forEach((orb, i) => {
          gsap.to(orb, {
            yPercent: i % 2 ? -40 : 40,
            xPercent: i % 2 ? 15 : -15,
            ease: "none",
            scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1.2 },
          });
        });
        ScrollTrigger.refresh();
      });
    }, 80);

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
    };
  }, [pathname]);
}

// Lift + gold glow on card hover.
function useCardHover() {
  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) return undefined;

    const SELECTOR = ".MuiCard-root:not(.rs-no-glass), .MuiPaper-root:not(.rs-no-glass)";
    const resolve = (e) => {
      const card = e.target.closest?.(SELECTOR);
      if (!card || !card.closest("main") || card.contains(e.relatedTarget)) return null;
      return card;
    };
    const onOver = (e) => {
      const card = resolve(e);
      if (!card) return;
      gsap.to(card, { y: -8, scale: 1.015, duration: 0.35, ease: "power2.out", overwrite: "auto" });
      card.classList.add("rs-card-hover");
    };
    const onOut = (e) => {
      const card = resolve(e);
      if (!card) return;
      gsap.to(card, { y: 0, scale: 1, duration: 0.45, ease: "power3.out", overwrite: "auto" });
      card.classList.remove("rs-card-hover");
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);
}

function MarketingEffects() {
  const { pathname } = useLocation();
  const theme = useTheme();
  useSparkleTrail();
  useScrollAnimations(pathname);
  useCardHover();

  useEffect(() => {
    document.body.classList.add("marketing-site");
    document.body.dataset.dark = theme.palette.mode === "dark" ? "true" : "false";
    return () => {
      document.body.classList.remove("marketing-site");
      delete document.body.dataset.dark;
    };
  }, [theme.palette.mode]);

  // Portalled to <body> so it can never take up space in the page layout.
  return createPortal(
    <div className="rs-orbs" aria-hidden="true">
      <span className="rs-orb rs-orb-gold" />
      <span className="rs-orb rs-orb-blue" />
      <span className="rs-orb rs-orb-gold2" />
    </div>,
    document.body
  );
}

export default MarketingEffects;
