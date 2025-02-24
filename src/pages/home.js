import React, { useEffect } from "react";
import { TopBar } from "./top_bar";
import "../styles/Home.css";
import "../styles/App.css";
import { motion } from "framer-motion";
import wahoosfishing from "../assets/wahoosfishing.png";
import khanclock from "../assets/khanclock.png";

export const Home = () => {
  useEffect(() => {
    // Trigger animations after component mount
    const elements = document.querySelectorAll(".animate-in");
    elements.forEach((element) => {
      element.classList.add("show");
    });
  }, []);

  return (
    <div className="home-page-content">
      <div className="intro-section">
        <motion.p
          className="greeting"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          Hi, my name is
        </motion.p>
        <motion.h1
          className="name"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.5,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          Oliver Nguyen.
        </motion.h1>
        <motion.h2
          className="description"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 2,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          I love to <a href="#build-definition">build</a> things.
        </motion.h2>
        <div style={{ height: "50vh" }}></div>
      </div>
      <main>
        <div className="definition">
          {<motionAnimateIn TEXT="hi" />}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 id="build-definition" style={{ textAlign: "left" }}>
              build
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2
              className="pronunciation"
              style={{ fontFamily: "GeistMono", fontSize: "1.5rem" }}
            >
              /bild/ • verb
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2
              className="definition-text"
              style={{ fontFamily: "GeistMono", fontSize: "1.5rem" }}
            >
              to develop according to a systematic plan, by a definite process,
              or on a particular base
              <br />
              <br />
            </h2>
            <h3>
              <a href="https://www.merriam-webster.com/dictionary/build">
                merriam-webster
              </a>
            </h3>
          </motion.div>
        </div>

        <div className="projects-section">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 style={{ textAlign: "left" }}>Things I've Built</h1>
          </motion.div>

          <div className="projects-list">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="project-card"
            >
              <div className="project-content">
                <h2>
                  <a
                    href="https://github.com/ollie88skwda/wahoosfishing"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Wahoo's Fishing Game
                    <svg
                      className="github-icon"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                </h2>
                <p className="project-description">
                  This project was built for the owner of Wahoo's fish tacos in
                  my marketing class. I learned Pygame and pixel art (using
                  paint.net) for this project. I gained valuable knowledge about
                  UX through feeback I recieved on my game.
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
                  <svg
                    className="github-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  View on GitHub
                </a>
              </div>
              <a
                href="https://github.com/ollie88skwda/wahoosfishing"
                target="_blank"
                rel="noopener noreferrer"
                className="project-image"
              >
                <img src={wahoosfishing} alt="Project screenshot" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="project-card reverse"
            >
              <div className="project-content">
                <h2>
                  <a
                    href="https://github.com/ollie88skwda/khanclock"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Khanclock (WIP)
                    <svg
                      className="github-icon"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                </h2>
                <p className="project-description">
                  This was a good introduction to Chrome extensions. With
                  Khanclock, I aimed to create a better practice environment for
                  SAT studiers, so they would feel the pressure of a timer while
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
                  <svg
                    className="github-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  View on GitHub
                </a>
              </div>
              <a
                href="https://github.com/ollie88skwda/khanclock"
                target="_blank"
                rel="noopener noreferrer"
                className="project-image"
              >
                <img src={khanclock} alt="Khanclock" />
              </a>
            </motion.div>

            {/* <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="project-card"
            >
              <div className="project-content">
                <h2>
                  <a
                    href="https://github.com/yourusername/project3"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Third Project
                    <svg
                      className="github-icon"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                </h2>
                <p className="project-description">
                  One more showcase of your building capabilities. Emphasize the
                  value created and lessons learned. Talk about the user
                  experience improvements and performance optimizations you
                  implemented.
                </p>
                <div className="project-tech">
                  <span>TypeScript</span>
                  <span>Next.js</span>
                  <span>Firebase</span>
                </div>
                <a
                  href="https://github.com/yourusername/project3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="github-button"
                >
                  <svg
                    className="github-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  View on GitHub
                </a>
              </div>
              <a
                href="https://github.com/yourusername/project3"
                target="_blank"
                rel="noopener noreferrer"
                className="project-image"
              >
                <img src="placeholder.jpg" alt="Project screenshot" />
              </a>
            </motion.div> */}
          </div>
        </div>

        <div className="skills-section">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 style={{ textAlign: "left" }}>Skills & Technologies</h1>
          </motion.div>

          <div className="skills-grid">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="skill-category"
            >
              <h2>Languages</h2>
              <ul>
                <li>JavaScript</li>
                <li>Python</li>
                <li>C++</li>
                {/* Add more languages you know */}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="skill-category"
            >
              <h2>Frameworks & Libraries</h2>
              <ul>
                <li>React</li>
                <li>Pygame</li>
                <li>Motion</li>
                {/* Add more frameworks you use */}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="skill-category"
            >
              <h2>Tools & Platforms</h2>
              <ul>
                <li>Git</li>
                <li>VS Code</li>
                {/* <li>AWS</li> */}
                {/* Add more tools you're familiar with */}
              </ul>
            </motion.div>
          </div>
        </div>
      </main>
      <TopBar />
    </div>
  );
};
