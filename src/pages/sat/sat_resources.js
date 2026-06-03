import React from 'react';
import "../../styles/App.css";
import { TopBar } from "../top_bar";

const SATResources = () => {
  return (
    <div>
      <div className="content">
        <main>
          <header>
            <h1>SAT study resources</h1>
          </header>
          <p>
            Everything here is stuff I actually used or built while studying.
            No fluff, no paid course recommendations.
          </p>

          <h2>1: Official practice</h2>
          <p>
            Start with{" "}
            <a
              href="https://bluebook.collegeboard.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bluebook
            </a>
            , College Board's official testing app. It has full-length adaptive
            practice tests that feel exactly like the real digital SAT. Take
            one cold to get a baseline, then space the rest out as you study.
          </p>

          <h2>2: Khan Academy</h2>
          <p>
            <a
              href="https://www.khanacademy.org/sat"
              target="_blank"
              rel="noopener noreferrer"
            >
              Official Digital SAT Prep on Khan Academy
            </a>{" "}
            is free and made with College Board, so the question style matches
            the real thing. The weakness is that there is no timer pressure,
            which is exactly why I built{" "}
            <a
              href="https://github.com/ollie88skwda/khanclock"
              target="_blank"
              rel="noopener noreferrer"
            >
              Khanclock
            </a>
            , a Chrome extension that adds a per-question timer to Khan Academy
            practice. Study with the clock running. The real test is a pacing
            game as much as a knowledge game.
          </p>

          <h2>3: Math</h2>
          <p>
            Learn the built-in{" "}
            <a
              href="https://www.desmos.com/calculator"
              target="_blank"
              rel="noopener noreferrer"
            >
              Desmos
            </a>{" "}
            calculator. It is embedded in the digital SAT and can brute-force a
            surprising number of algebra questions (graph both sides of an
            equation and find the intersection). Practicing WITH Desmos is one
            of the highest-value things you can do for the math section.
          </p>

          <h2>4: Reading and writing</h2>
          <p>
            The digital SAT reading questions are short, so volume matters more
            than stamina. Drill question types until you can name the trap in
            each wrong answer. Review every miss: knowing WHY an answer was
            wrong is worth more than ten new questions.
          </p>

          <h2>5: The week before</h2>
          <p>
            Take one full Bluebook practice test a few days out, then stop
            cramming. Know your test center, charge your device, bring a
            backup pencil for scratch work. Sleep. Pacing and calm beat
            last-minute content review.
          </p>
        </main>
      </div>
      <TopBar />
    </div>
  );
};

export default SATResources;
