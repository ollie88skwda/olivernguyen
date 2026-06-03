import React, { useEffect, useState } from "react";
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

export const Home = () => {
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

      {/* ── About bento ────────────────────────────────────────────────── */}
      <section id="about" className="sec sec-about">
        <SectionHeading eyebrow="U1 / About" title="The Short Version" />
        <Reveal as="p" className="about-lead">
          I build games, browser extensions, and small web apps. Most of what I
          make starts as a problem I personally ran into, then grows into
          something other people end up using too. I care about the details
          that make software feel good.
        </Reveal>
        {/* datasheet rows: the PCB-world information format, no boxes */}
        <dl className="specs">
          <Reveal as="div" className="spec-row spec-now" delay={0.05}>
            <dt>Now</dt>
            <dd>
              Deep in college applications, and building with my robotics team.
            </dd>
          </Reveal>
          <Reveal as="div" className="spec-row" delay={0.1}>
            <dt>Based in</dt>
            <dd>
              California <span className="spec-meta"><LocalClock /></span>
            </dd>
          </Reveal>
          <Reveal as="div" className="spec-row" delay={0.15}>
            <dt>Education</dt>
            <dd>
              <div className="spec-line">
                Legacy Magnet Academy
                <span className="spec-meta">MS + HS · Class of 2027</span>
              </div>
              <div className="spec-line">
                Irvine Valley College
                <span className="spec-meta">Dual enrolled · Jan 2022 to 2027</span>
              </div>
            </dd>
          </Reveal>
        </dl>
      </section>

      {/* ── Work ───────────────────────────────────────────────────────── */}
      <section id="work" className="sec sec-work">
        <SectionHeading eyebrow="U2 / Selected work" title="Things I've Built" />
        <div className="projects">
          <Reveal>
            <TiltCard className="project-card">
              <div className="pnum">01</div>
              <div className="project-content">
                <h2 className="project-title">
                  <a
                    href="https://github.com/ollie88skwda/wahoosfishing"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Wahoo's Fishing Game
                  </a>
                </h2>
                <p className="project-description">
                  Built for the owner of Wahoo's fish tacos in my marketing
                  class. I learned Pygame and pixel art (using paint.net) for
                  this project, and gained valuable knowledge about UX through
                  the feedback I received on my game.
                </p>
                <div className="project-tech">
                  <span>Python</span>
                  <span>Pygame</span>
                  <span>paint.net</span>
                </div>
                <a
                  href="https://github.com/ollie88skwda/wahoosfishing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="github-button"
                >
                  View on GitHub
                </a>
              </div>
              <div className="project-image">
                <img
                  src={wahoosfishing}
                  alt="Wahoo's Fishing Game screenshot"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </TiltCard>
          </Reveal>

          <Reveal delay={0.05}>
            <TiltCard className="project-card">
              <div className="pnum">02</div>
              <div className="project-content">
                <h2 className="project-title">
                  <a
                    href="https://github.com/ollie88skwda/khanclock"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Khanclock (WIP)
                  </a>
                </h2>
                <p className="project-description">
                  A good introduction to Chrome extensions. With Khanclock, I
                  aimed to create a better practice environment for SAT
                  studiers, so they would feel the pressure of a timer while
                  going through Khan Academy questions.
                </p>
                <div className="project-tech">
                  <span>HTML</span>
                  <span>CSS</span>
                  <span>JavaScript</span>
                </div>
                <a
                  href="https://github.com/ollie88skwda/khanclock"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="github-button"
                >
                  View on GitHub
                </a>
              </div>
              <div className="project-image">
                <img
                  src={khanclock}
                  alt="Khanclock screenshot"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </TiltCard>
          </Reveal>
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
