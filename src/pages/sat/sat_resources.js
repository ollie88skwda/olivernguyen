import React from "react";
import "../../App.css";
import { TopBar } from "../top_bar";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const SATResources = () => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    setIsVisible(true);
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, translateY: -100 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              duration: 0.8,
              type: "tween",
            }}
            style={{ willChange: "opacity, transform" }}
            exit={{ opacity: 0, translateY: 10 }}
          >
            <div className="content">
              <main>
                <header>
                  <h1>Important stuff to know for the SAT </h1>
                </header>
                <div className="section1">
                  <h2>1: Strategy</h2>
                  <p>
                    What I've found works for me is probably different than the
                    standard strategy, so take a lot of practice tests and
                    figure out your own. This is what is easiest for me.
                  </p>
                  <h2>English</h2>
                  <p>
                    The general strategy for all questions is to start off doing
                    the fast questions. This means I start with the vocab
                    questions, then when I start getting to the longer questions
                    (around q4-6 is when it starts), skip to q14 and go forward
                    until you find faster questions. Then when you get to the
                    end of the section, go back to all the long questions.
                  </p>
                  <h2>Math</h2>
                  <p>
                    For math, I generally don't skip questions and just go start
                    to finish. However, what you should do is aim to finish with
                    a bit of time left (very easy for M1 but not for M2). This
                    means that you should go through q1-~17 as fast as you can
                    and just be confident in your answers, which will leave you
                    more time for the last ~5 questions.
                  </p>
                </div>
                <div className="section2">
                  <h2>2: Studying</h2>
                  <p>
                    <h2>English</h2>
                    <p>
                      The strategy for learning English is pretty generic. I
                      recommend Khan Academy since it is widely used and free.
                      The strategy is very different than every other English
                      test you've taken, so get familiar with the question
                      types.
                    </p>
                    <h2>Math</h2>
                    <p>
                      For math, I have a slightly different opinion than normal.
                      For starters, pay attention in Algebra II. If you didn't
                      or you still feel your math foundations aren't there, use
                      the Panda Math book for the Digital SAT. I've heard great
                      things about it, but IMO it's not necessary if you already
                      have the foundational math skills. <br />
                      <br />
                      Once you have all the fundamentals and Algebra skills,
                      start studying Desmos. Desmos is so helpful that I
                      personally use Desmos for basically every question on both
                      math modules. I recommend the Desmos course by 1600.io.
                      They give you a one month free trial, so use that and
                      learn all the Desmos tricks (regression, finding both
                      solutions of a quadratic, etc). There are so many cool
                      tricks in that course that saved me so much time on the
                      real thing and bumped my scores from low 700s and high
                      600s to a 770 on the real test. It's also super fast to
                      learn Desmos stuff, which is a great perk too.
                    </p>
                  </p>
                </div>
              </main>
            </div>
          </motion.div>
        )}
        <TopBar />
      </AnimatePresence>
    </div>
  );
};

export default SATResources;
