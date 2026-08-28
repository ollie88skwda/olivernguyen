// ⚠️ UNMOUNTED (graph-v1 X-1, plan P4): "/" now mounts src/home/Home.jsx
// (GraphHome / TerminalHome). This file is intentionally left in
// the tree, not deleted — restore by re-pointing the import in src/Routes.js.
import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import "../styles/Home.css";
import Reveal from "../components/Reveal";
import WordReveal from "../components/WordReveal";
import TiltCard from "../components/TiltCard";
import SectionHeading from "../components/SectionHeading";
import Marquee from "../components/Marquee";
import MagneticButton from "../components/MagneticButton";
import articleshot from "../article_writer_stuff/images/processed_image0.png";
import oliverPhoto from "../assets/oliver.jpg";

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
              I turn ideas into things people actually use.
            </Reveal>
          </div>
          <Reveal className="hero-meta" delay={0.55}>
            <div className="meta-lead">Builds with LLMs + agents</div>
            <div>Robotics mentor & coach</div>
            <div>College-bound</div>
          </Reveal>
        </div>
      </section>

      {/* ── Kinetic marquee: real tokens, nothing invented. Decorative —
             content repeats in About/Toolkit, so hidden from screen readers */}
      <div aria-hidden="true">
        <Marquee
          className="hero-marquee"
          speed={34}
          items={[
            "LLM AGENTS",
            <Px key="p1" />,
            "MCP TOOLS",
            <Px key="p2" />,
            "CHROME EXTENSIONS",
            <Px key="p3" />,
            "AUTONOMOUS LOOPS",
            <Px key="p4" />,
            "ROBOTICS",
            <Px key="p5" />,
            "MENTORSHIP",
            <Px key="p6" />,
            "PIXEL ART",
            <Px key="p7" />,
          ]}
        />
      </div>

      {/* ── About: lead + signal path (chronology as a routed trace) ───── */}
      <section id="about" className="sec sec-about">
        <SectionHeading eyebrow="U1 / About" title="The Short Version" />
        <div className="about-grid">
          <Reveal as="p" className="about-lead">
            I build with LLMs and autonomous agents: Claude agents with custom
            MCP tools, an operator loop that ran a project by itself for a
            week, and pipelines that ship real output. Off the keyboard I
            mentor robotics — 15+ students, three rookie teams, one Worlds
            qualification — and spent two years tutoring competition math.
          </Reveal>
          <Reveal className="about-photo" delay={0.12}>
            <img
              src={oliverPhoto}
              alt="Oliver Nguyen"
              loading="lazy"
              decoding="async"
            />
            <span className="about-photo-cap">Fig. 01 · Oliver</span>
          </Reveal>
        </div>

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
              <span className="sig-meta">Dual enrolled · 4.0</span>
            </div>
          </Reveal>
          <Reveal className="sig-node" delay={0.12}>
            <span className="sig-px" aria-hidden="true" />
            <div className="sig-row">
              <span className="sig-year">2023</span>
              <span className="sig-name">TechX Robotics — mentor & coach</span>
              <span className="sig-meta">15+ students · Worlds-qualified team</span>
            </div>
          </Reveal>
          <Reveal className="sig-node" delay={0.16}>
            <span className="sig-px" aria-hidden="true" />
            <div className="sig-row">
              <span className="sig-year">2025</span>
              <span className="sig-name">
                Virtual Enterprise — VP of Digital Operations
              </span>
              <span className="sig-meta">Gold · rapid prototyping</span>
            </div>
          </Reveal>
          <Reveal className="sig-node sig-now" delay={0.2}>
            <span className="sig-px" aria-hidden="true" />
            <div className="sig-row">
              <span className="sig-year">Now</span>
              <span className="sig-name">
                College apps, robotics team, and building Claude agents
              </span>
              <span className="sig-meta">
                California · <LocalClock />
              </span>
            </div>
          </Reveal>
          <Reveal className="sig-node sig-future" delay={0.28}>
            <span className="sig-px" aria-hidden="true" />
            <div className="sig-row">
              <span className="sig-year">2027</span>
              <span className="sig-name">Graduation</span>
              <span className="sig-meta">Predicted</span>
            </div>
          </Reveal>
        </div>

        {/* datasheet strips: numbers straight from the resume */}
        <Reveal className="about-numbers" delay={0.1}>
          <span>15+ students mentored</span>
          <span>17 awards in one season</span>
          <span>4x states qualifier</span>
          <span>30+ robots coached</span>
          <span>Eagle Scout</span>
        </Reveal>
        <Reveal className="about-numbers" delay={0.15}>
          <span>UCI ICS AI/ML Summer '24</span>
          <span>Stanford Intro Statistics '23</span>
          <span>1540 SAT</span>
          <span>4.0 UW GPA</span>
        </Reveal>
      </section>

      {/* ── Work: editorial rows, no cards ─────────────────────────────── */}
      <section id="work" className="sec sec-work">
        <SectionHeading eyebrow="U2 / Selected work" title="Things I've Built" />
        <div className="work-list">
          <Reveal as="article" className="work-row">
            <div className="work-head">
              <span className="wh-index">01</span>
              <span className="wh-type">Claude Agent SDK · MCP</span>
              <span className="wh-status">Active WIP</span>
            </div>
            <span className="work-rail" aria-hidden="true">
              Project / 01
            </span>
            <div className="work-body">
              <div className="work-copy">
                <h2 className="work-title">
                  Niobium <span className="nowrap">Mac-Agent</span>
                </h2>
                <p className="work-blurb">
                  A Claude agent built on Anthropic's Agent SDK: streaming tool
                  use, model aliasing, and a custom in-process MCP registry that
                  exposes vault search, lead scoring, and content tools to the
                  model. It runs as the agent backend for a Convex and Next.js
                  dashboard.
                </p>
                <div className="work-tech">
                  Claude Agent SDK <DotPx /> TypeScript <DotPx /> MCP <DotPx />{" "}
                  Convex
                </div>
                <span className="work-link plain">Private repo</span>
              </div>
              <TiltCard className="work-shot">
                <div className="shot-frame artifact">
                  <div className="art-head">mac-agent / mcp / registry.ts</div>
                  <pre>{`vault_read         vault_write
vault_search       lead_lookup
rescore_leads      generate_dm_batch
generate_audit_pdf tasks`}</pre>
                </div>
              </TiltCard>
            </div>
          </Reveal>

          <Reveal as="article" className="work-row rev" delay={0.05}>
            <div className="work-head">
              <span className="wh-index">02</span>
              <span className="wh-type">Autonomous Claude Code loop</span>
              <span className="wh-status">Ran 7 days</span>
            </div>
            <span className="work-rail" aria-hidden="true">
              Project / 02
            </span>
            <div className="work-body">
              <div className="work-copy">
                <h2 className="work-title">Voice / Operator</h2>
                <p className="work-blurb">
                  A Claude Code loop that built and operated a project on its
                  own for a week, logging every judgment call to an append-only
                  decisions file. A small Python script reads the operator
                  state and emails me a summary of what it did each morning.
                </p>
                <div className="work-tech">
                  Claude Code <DotPx /> Python <DotPx /> LaunchAgent
                </div>
                <span className="work-link plain">Private repo</span>
              </div>
              <TiltCard className="work-shot">
                <div className="shot-frame artifact">
                  <div className="art-head">decisions.html · operator log</div>
                  <pre>{`257 decision entries
2026-05-21 to 2026-05-27
operator-state.js  · live state
morning_summary.py · 8 AM daily`}</pre>
                </div>
              </TiltCard>
            </div>
          </Reveal>

          <Reveal as="article" className="work-row">
            <div className="work-head">
              <span className="wh-index">03</span>
              <span className="wh-type">Chrome MV3 · zero-LLM by design</span>
              <span className="wh-status shipped">v0.4.0 beta</span>
            </div>
            <span className="work-rail" aria-hidden="true">
              Project / 03
            </span>
            <div className="work-body">
              <div className="work-copy">
                <h2 className="work-title">
                  <a
                    href="https://github.com/ollie88skwda/scopecreep"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ScopeCreep Notary
                  </a>
                </h2>
                <p className="work-blurb">
                  A Chrome extension that scans client messages for
                  scope-expanding language and drafts the change-order email in
                  one click. Detection is a hand-curated weighted lexicon with
                  no model at runtime. Knowing when not to use an LLM was the
                  point.
                </p>
                <div className="work-tech">
                  JavaScript <DotPx /> Chrome MV3 <DotPx /> Vercel
                </div>
                <a
                  className="work-link"
                  href="https://github.com/ollie88skwda/scopecreep"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub ↗
                </a>
              </div>
              <TiltCard className="work-shot">
                <div className="shot-frame artifact">
                  <div className="art-head">detection · lexicon</div>
                  <pre>{`15 phrase categories
severity x category weights
runtime LLM calls: 0
Chrome Web Store: pending`}</pre>
                </div>
              </TiltCard>
            </div>
          </Reveal>

          <Reveal as="article" className="work-row rev" delay={0.05}>
            <div className="work-head">
              <span className="wh-index">04</span>
              <span className="wh-type">OpenAI pipeline · FastAPI</span>
              <span className="wh-status">2024</span>
            </div>
            <span className="work-rail" aria-hidden="true">
              Project / 04
            </span>
            <div className="work-body">
              <div className="work-copy">
                <h2 className="work-title">Articlewriter</h2>
                <p className="work-blurb">
                  A multi-stage LLM pipeline: three task-specific prompts
                  decompose the job — rank the ten best products in a category,
                  write the full article, tag it — with structured output
                  gluing the stages. Product data comes from the Amazon PA-API;
                  images are composited with PIL and OpenCV behind a FastAPI
                  endpoint.
                </p>
                <div className="work-tech">
                  Python <DotPx /> gpt-4o-mini <DotPx /> FastAPI <DotPx />{" "}
                  OpenCV
                </div>
                <span className="work-link plain">Private repo</span>
              </div>
              <TiltCard className="work-shot">
                <div className="shot-frame">
                  <img
                    src={articleshot}
                    alt="Composited product collage generated by the Articlewriter pipeline"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </TiltCard>
            </div>
          </Reveal>

          <div className="work-end" aria-hidden="true">
            <span>{"// end U2"}</span>
            <span>04 builds logged</span>
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
          items={[
            "Claude Agent SDK",
            "MCP servers",
            "OpenAI API",
            "Agent pipelines",
            "Rapid prototyping",
            "CAD · Fusion + Inventor",
          ]}
        />
        <Marquee
          speed={52}
          reverse
          items={[
            "Mentoring 15+ students",
            "Robotics coaching",
            "Team leadership",
            "Teaching & tutoring",
            "Communication",
            "Entrepreneurship",
          ]}
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
    </div>
  );
};

export default Home;
