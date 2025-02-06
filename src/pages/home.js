import React, { useEffect } from "react";
import { TopBar } from "./top_bar";
import "../Home.css";
import { motion } from "framer-motion";

// function motionAnimateIn(TEXT) {
//   return (
//   <motion.div
//     initial={{ opacity: 0, y: -20 }}
//     whileInView={{ opacity: 1, y: 0 }}
//     transition={{ duration: 0.8 }}>
//       <h1>{TEXT}</h1>
//     </motion.div>
//   );
// }
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
        <p className="greeting animate-in">Hi, my name is</p>
        <h1 className="name animate-in">Oliver Nguyen.</h1>
        <h2 className="description animate-in">
          I love to <a>build</a> things.
        </h2>
        <div style={{ height: "50rem" }}></div>
      </div>
      <main>
        <div className="definition">
          {<motionAnimateIn TEXT="hi"/>}
          {/* <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 style={{textAlign: "left"}}>build</h1>
          </motion.div> */}
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
            </h2>
          </motion.div>
        </div>
      </main>
      <TopBar />
    </div>
  );
};
