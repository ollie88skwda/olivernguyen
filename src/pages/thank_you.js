import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "./top_bar";
import "../styles/Thank_You.css";

const ThankYou = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <TopBar />
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            duration: 0.8,
            type: "tween",
          }}
          style={{ willChange: "opacity, transform" }}
          exit={{ opacity: 0, translateY: 10 }}
        >
          <div className="content">
            <main className="thank-you-page">
              <div className="thank-you-container">
                <h1>Thank You!</h1>
                <p>Your order has been submitted successfully.</p>
                <p>We'll be in touch with you soon.</p>
                
                <div className="button-container">
                  {/* <a href="/" className="action-button home-button">
                    Return Home
                  </a> */}
                  <a href="/order" className="action-button order-button">
                    Submit Another Order
                  </a>
                </div>
              </div>
            </main>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default ThankYou;
