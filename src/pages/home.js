import React from "react";
import { TopBar } from "./top_bar";
import "../styles/Home.css";
import Reveal from "../components/Reveal";
import WordReveal from "../components/WordReveal";
import TiltCard from "../components/TiltCard";
import SectionHeading from "../components/SectionHeading";
import wahoosfishing from "../assets/wahoosfishing.png";
import khanclock from "../assets/khanclock.png";

const GithubIcon = () => (
  <svg className="github-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export const Home = () => {
  return (
    <div className="home">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="hero">
        <svg
          className="hero-wire"
          viewBox="0 0 200 200"
          fill="none"
          stroke="#E8B765"
          strokeWidth="1"
          aria-hidden="true"
        >
          <polygon points="100,8 184,60 184,140 100,192 16,140 16,60" />
          <polygon points="100,48 152,78 152,138 100,168 48,138 48,78" />
          <line x1="100" y1="8" x2="100" y2="48" />
          <line x1="184" y1="60" x2="152" y2="78" />
          <line x1="184" y1="140" x2="152" y2="138" />
          <line x1="100" y1="192" x2="100" y2="168" />
          <line x1="16" y1="140" x2="48" y2="138" />
          <line x1="16" y1="60" x2="48" y2="78" />
          <line x1="48" y1="78" x2="152" y2="138" />
          <line x1="152" y1="78" x2="48" y2="138" />
          <line x1="100" y1="48" x2="100" y2="168" />
        </svg>

        <Reveal as="p" className="hero-eyebrow">
          Hi, my name is
        </Reveal>
        <h1 className="hero-name">
          <WordReveal text="Oliver Nguyen." />
        </h1>
        <Reveal as="p" className="hero-sub" delay={0.5}>
          I love to{" "}
          <a className="hero-link" href="#projects">
            build
          </a>{" "}
          things.
        </Reveal>
      </section>

      {/* ── About ──────────────────────────────────────────────────────── */}
      <section id="about">
        <SectionHeading eyebrow="01 — About" title="About" />
        <div className="about-body">
          {/* TODO: replace with your own bio */}
          <Reveal as="p">
            I&apos;m Oliver — a developer who likes turning ideas into things
            people can actually use. I build games, browser extensions, and small
            web apps, and I care about the details that make software feel good.
          </Reveal>
          <Reveal as="p" delay={0.05}>
            Most of what I make starts as a problem I personally ran into, then
            grows into a tool other people end up using too.
          </Reveal>
          <Reveal className="now">
            <span className="now-label">Now</span>
            {/* TODO: what you're working on / learning right now */}
            <p className="now-text">
              Currently building out this site and learning more about design
              engineering and motion.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Projects ───────────────────────────────────────────────────── */}
      <section id="projects">
        <SectionHeading eyebrow="02 — Work" title="Things I've Built" />
        <div className="projects">
          <Reveal>
            <TiltCard className="project-card">
              <div className="project-content">
                <h2 className="project-title">
                  <a
                    href="https://github.com/ollie88skwda/wahoosfishing"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Wahoo&apos;s Fishing Game <GithubIcon />
                  </a>
                </h2>
                <p className="project-description">
                  Built for the owner of Wahoo&apos;s fish tacos in my marketing
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
                  <GithubIcon />
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
            <TiltCard className="project-card reverse">
              <div className="project-content">
                <h2 className="project-title">
                  <a
                    href="https://github.com/ollie88skwda/khanclock"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Khanclock (WIP) <GithubIcon />
                  </a>
                </h2>
                <p className="project-description">
                  A good introduction to Chrome extensions. With Khanclock, I
                  aimed to create a better practice environment for SAT studiers,
                  so they would feel the pressure of a timer while going through
                  Khan Academy questions.
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
                  <GithubIcon />
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

      {/* ── Skills ─────────────────────────────────────────────────────── */}
      <section id="skills">
        <SectionHeading eyebrow="03 — Stack" title="Skills & Technologies" />
        <div className="skills">
          <Reveal className="skill">
            <h3>Languages</h3>
            <div className="pills">
              <span className="pill">JavaScript</span>
              <span className="pill">Python</span>
              <span className="pill">C++</span>
            </div>
          </Reveal>
          <Reveal className="skill" delay={0.05}>
            <h3>Frameworks &amp; Libraries</h3>
            <div className="pills">
              <span className="pill">React</span>
              <span className="pill">Pygame</span>
              <span className="pill">Motion</span>
            </div>
          </Reveal>
          <Reveal className="skill" delay={0.1}>
            <h3>Tools &amp; Platforms</h3>
            <div className="pills">
              <span className="pill">Git</span>
              <span className="pill">VS Code</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Education ──────────────────────────────────────────────────── */}
      <section id="education">
        <SectionHeading eyebrow="04 — Background" title="Education" />
        {/* TODO: replace with your real school / grad year / experience */}
        <Reveal className="edu-item">
          <div className="role">Your School Name</div>
          <div className="meta">Expected 20XX — Your focus / field</div>
          <p>
            A line or two about what you studied, clubs, or relevant coursework.
          </p>
        </Reveal>
      </section>

      {/* ── Contact ────────────────────────────────────────────────────── */}
      <section id="contact">
        <SectionHeading eyebrow="05 — Contact" title="Get In Touch" />
        <Reveal as="p" className="about-body">
          The fastest way to reach me is email. I&apos;m always happy to talk
          about projects, ideas, or anything I&apos;ve built.
        </Reveal>
        <Reveal className="contact-links" delay={0.05}>
          <a className="contact-link primary" href="mailto:oliverdnguyen@gmail.com">
            Email me ↗
          </a>
          <a
            className="contact-link"
            href="https://github.com/ollie88skwda"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub ↗
          </a>
          {/* TODO: replace with your LinkedIn URL */}
          <a
            className="contact-link"
            href="https://www.linkedin.com/in/your-handle"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn ↗
          </a>
          {/* TODO: drop resume.pdf into /public */}
          <a className="contact-link" href="/resume.pdf" target="_blank" rel="noopener noreferrer">
            Resume ↗
          </a>
        </Reveal>
      </section>

      <footer className="home-footer">
        <span>© {new Date().getFullYear()} Oliver Nguyen</span>
        <span>Built with React · Designed in navy &amp; gold</span>
      </footer>

      <TopBar />
    </div>
  );
};

export default Home;
