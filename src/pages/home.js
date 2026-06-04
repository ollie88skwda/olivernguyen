import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TopBar } from "./top_bar";
import "../styles/Home.css";
import Reveal from "../components/Reveal";
import WordReveal from "../components/WordReveal";
import TiltCard from "../components/TiltCard";
import SectionHeading from "../components/SectionHeading";
import Marquee from "../components/Marquee";
import MagneticButton from "../components/MagneticButton";
import CircuitTrace from "../components/CircuitTrace";
import wahoosfishing from "../assets/wahoosfishing.png";
import khanclock from "../assets/khanclock.png";

const EMAIL = "oliverdnguyen@gmail.com";

const LocalClock = () => {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          timeZone: "America/Los_Angeles",
          hour: "2-digit",
          minute: "2-digit",
        }) + " PT"
      );
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
};

const Px = () => <span className="px" aria-hidden="true" />;
const DotPx = () => <i className="dot-px" aria-hidden="true" />;

export const Home = () => {
  const reduce = useReducedMotion();
  return (
    <div className="home">
      <CircuitTrace />
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-grid">
          <div>
            <Reveal as="p" className="hero-eyebrow">
              Hi, my name is
            </Reveal>
            <h1 className="hero-name">
              <WordReveal text="Oliver Nguyen." accentPeriod />
            </h1>
            <Reveal as="p" className="hero-sub" delay={0.45}>
              I turn ideas into things people actually use. I love to{" "}
              <a className="hero-link" href="#work">
                build
              </a>
              .
            </Reveal>
          </div>
          <Reveal className="hero-meta" delay={0.55}>
            <div className="meta-lead">2 projects shipped</div>
            <div>Developer / maker</div>
            <div>College-bound</div>
          </Reveal>
        </div>
      </section>

      {/* ── Kinetic marquee: real tokens, nothing invented ─────────────── */}
      <Marquee
        className="hero-marquee"
        speed={34}
        items={[
          "GAMES",
          <Px key="p1" />,
          "BROWSER TOOLS",
          <Px key="p2" />,
          "WEB APPS",
          <Px key="p3" />,
          "ROBOTICS",
          <Px key="p4" />,
          "PIXEL ART",
          <Px key="p5" />,
        ]}
      />

      {/* ── About: lead + signal path (chronology as a routed trace) ───── */}
      <section id="about" className="sec sec-about">
        <SectionHeading eyebrow="U1 / About" title="The Short Version" />
        <Reveal as="p" className="about-lead">
          I build games, browser extensions, and small web apps. Most of what I
          make starts as a problem I personally ran into, then grows into
          something other people end up using too. I care about the details
          that make software feel good.
        </Reveal>

        <div className="sig-path">
          <motion.span
            className="sig-line"
            aria-hidden="true"
            initial={reduce ? { scaleY: 1 } : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
          <Reveal className="sig-node">
            <span className="sig-px" aria-hidden="true" />
            <div className="sig-row">
              <span className="sig-year">2020</span>
              <span className="sig-name">Legacy Magnet Academy</span>
              <span className="sig-meta">MS + HS</span>
            </div>
          </Reveal>
          <Reveal className="sig-node" delay={0.08}>
            <span className="sig-px" aria-hidden="true" />
            <div className="sig-row">
              <span className="sig-year">2022</span>
              <span className="sig-name">Irvine Valley College</span>
              <span className="sig-meta">Dual enrolled</span>
            </div>
          </Reveal>
          <Reveal className="sig-node sig-now" delay={0.16}>
            <span className="sig-px" aria-hidden="true" />
            <div className="sig-row">
              <span className="sig-year">Now</span>
              <span className="sig-name">
                College applications, and building with my robotics team
              </span>
              <span className="sig-meta">
                California · <LocalClock />
              </span>
            </div>
          </Reveal>
          <Reveal className="sig-node sig-future" delay={0.24}>
            <span className="sig-px" aria-hidden="true" />
            <div className="sig-row">
              <span className="sig-year">2027</span>
              <span className="sig-name">Graduation</span>
              <span className="sig-meta">Predicted</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Work: editorial rows, no cards ─────────────────────────────── */}
      <section id="work" className="sec sec-work">
        <SectionHeading eyebrow="U2 / Selected work" title="Things I've Built" />
        <div className="work-list">
          <Reveal as="article" className="work-row">
            <div className="work-head">
              <span className="wh-index">01</span>
              <span className="wh-type">Game · Pygame</span>
              <span className="wh-status shipped">Shipped</span>
            </div>
            <span className="work-rail" aria-hidden="true">
              Project / 01
            </span>
            <div className="work-body">
            <div className="work-copy">
              <h2 className="work-title">
                <a
                  href="https://github.com/ollie88skwda/wahoosfishing"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Wahoo's Fishing Game
                </a>
              </h2>
              <p className="work-blurb">
                Built for the owner of Wahoo's fish tacos in my marketing
                class. I learned Pygame and pixel art (using paint.net) for
                this project, and gained valuable knowledge about UX through
                the feedback I received on my game.
              </p>
              <div className="work-tech">
                Python <DotPx /> Pygame <DotPx /> paint.net
              </div>
              <a
                className="work-link"
                href="https://github.com/ollie88skwda/wahoosfishing"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub ↗
              </a>
            </div>
            <TiltCard className="work-shot">
              <div className="shot-frame">
                <img
                  src={wahoosfishing}
                  alt="Wahoo's Fishing Game screenshot"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </TiltCard>
            </div>
          </Reveal>

          <Reveal as="article" className="work-row rev" delay={0.05}>
            <div className="work-head">
              <span className="wh-index">02</span>
              <span className="wh-type">Chrome Extension</span>
              <span className="wh-status">WIP</span>
            </div>
            <span className="work-rail" aria-hidden="true">
              Project / 02
            </span>
            <div className="work-body">
            <div className="work-copy">
              <h2 className="work-title">
                <a
                  href="https://github.com/ollie88skwda/khanclock"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Khanclock (WIP)
                </a>
              </h2>
              <p className="work-blurb">
                A good introduction to Chrome extensions. With Khanclock, I
                aimed to create a better practice environment for SAT studiers,
                so they would feel the pressure of a timer while going through
                Khan Academy questions.
              </p>
              <div className="work-tech">
                HTML <DotPx /> CSS <DotPx /> JavaScript
              </div>
              <a
                className="work-link"
                href="https://github.com/ollie88skwda/khanclock"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub ↗
              </a>
            </div>
            <TiltCard className="work-shot">
              <div className="shot-frame">
                <img
                  src={khanclock}
                  alt="Khanclock screenshot"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </TiltCard>
            </div>
          </Reveal>

          <div className="work-end" aria-hidden="true">
            <span>{"// end U2"}</span>
            <span>02 builds logged</span>
          </div>
        </div>
      </section>

      {/* ── Skills marquees: slow, pause on hover, honest list ─────────── */}
      <section id="skills" className="sec sec-skills">
        <SectionHeading eyebrow="U3 / Toolkit" title="What I Work With" />
      </section>
      <div className="skills-band">
        <Marquee
          speed={46}
          items={["JavaScript", "Python", "C++", "React", "Pygame", "Framer Motion"]}
        />
        <Marquee
          speed={52}
          reverse
          items={["Chrome Extensions", "Supabase", "Git", "HTML", "CSS", "Pixel Art"]}
        />
      </div>

      {/* ── Contact ────────────────────────────────────────────────────── */}
      <section id="contact" className="sec sec-contact">
        <Reveal as="p" className="section-eyebrow">
          U4 / Contact
        </Reveal>
        <Reveal as="h2" className="contact-big" delay={0.05}>
          LET'S BUILD
          <br />
          <span className="stroke">SOMETHING.</span>
        </Reveal>
        <Reveal as="p" className="contact-lead" delay={0.1}>
          The fastest way to reach me is email. Always happy to talk projects,
          ideas, or anything I've built.
        </Reveal>
        <Reveal className="contact-row" delay={0.15}>
          <MagneticButton
            className="contact-cta"
            href={`mailto:${EMAIL}`}
            onClick={() => {
              if (navigator.clipboard) navigator.clipboard.writeText(EMAIL);
            }}
          >
            {EMAIL}
          </MagneticButton>
          <a
            className="contact-link"
            href="https://github.com/ollie88skwda"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub ↗
          </a>
          <a
            className="contact-link"
            href="https://www.linkedin.com/in/oliver-nguyen-988b2a2a3/"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn ↗
          </a>
          <a
            className="contact-link"
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Resume ↗
          </a>
        </Reveal>
      </section>

      <footer className="home-footer">
        <span>© {new Date().getFullYear()} Oliver Nguyen</span>
        <span>oN.c · REV 2027</span>
      </footer>

      <TopBar />
    </div>
  );
};

export default Home;
