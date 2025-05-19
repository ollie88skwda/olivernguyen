import React, { useState, useEffect } from "react";
import "../App.css";
import { TopBar } from "./top_bar";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/Order.css";

const Order = () => {
  const [isVisible, setIsVisible] = useState(false);
  // const [totalPrice, setTotalPrice] = useState(30); // Default to back only price
  const [logoPlacement, setLogoPlacement] = useState("back");
  const [contactMethod, setContactMethod] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  useEffect(() => {
    setIsVisible(true);
    window.scrollTo(0, 0);
  }, []);

  // Update price based on logo placement
  const handleLogoPlacementChange = (e) => {
    const placement = e.target.value;
    setLogoPlacement(placement);
    // setTotalPrice(placement === "front_and_back" ? 35 : 30);
  };

  // Handle contact method change
  const handleContactMethodChange = (e) => {
    const method = e.target.value;
    setContactMethod(method);
    
    // Reset contact info when changing method
    if (method === "discord" || method === "instagram") {
      setContactInfo("@");
    } else {
      setContactInfo("");
    }
  };

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
              <main className="order-page">
                <header>
                  <h1>Place Your Order</h1>
                </header>
                <div className="order-form-container">
                  <form action="https://formsubmit.co/oliverdnguyen@gmail.com, ollien456@gmail.com" method="POST" className="order-form">
                    <input type="hidden" name="_next" value={window.location.href} />
                    <input type="hidden" name="_subject" value="New Order Submission" />
                    <input type="hidden" name="_captcha" value="false" />
                    <input type="hidden" name="_cc" value="aiden.rodrigo8@gmail.com" />

                    <div className="form-group">
                      <label htmlFor="name">Name</label>
                      <input type="text" name="name" id="name" required />
                    </div>

                    <div className="form-group">
                      <label htmlFor="contact_method">Preferred Contact Method</label>
                      <select 
                        name="contact_method" 
                        id="contact_method" 
                        value={contactMethod}
                        onChange={handleContactMethodChange}
                        required
                      >
                        <option value="">-- Select Contact Method --</option>
                        <option value="number">Phone Number</option>
                        <option value="discord">Discord</option>
                        <option value="instagram">Instagram</option>
                        <option value="email">Email</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="contact_info">Contact Information</label>
                      <input 
                        type="text" 
                        name="contact_info" 
                        id="contact_info" 
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        required 
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="color">Desired Color</label>
                      <input type="text" name="color" id="color" required />
                    </div>

                    <div className="form-group">
                      <label htmlFor="size">Size</label>
                      <select name="size" id="size" required>
                        <option value="">-- Select Size --</option>
                        <option value="S">Small</option>
                        <option value="M">Medium</option>
                        <option value="L">Large</option>
                        <option value="XL">X-Large</option>
                        <option value="2XL">2X-Large</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="logo_placement">Sussy Logo Placement</label>
                      <select 
                        name="logo_placement" 
                        id="logo_placement" 
                        onChange={handleLogoPlacementChange}
                        value={logoPlacement}
                        required
                      >
                        <option value="back">Back Only</option>
                        <option value="front_and_back">Front and Back)</option>
                      </select>
                    </div>

                    {/* <div className="form-group">
                      <label htmlFor="payment_method">Payment Method</label>
                      <select name="payment_method" id="payment_method" required>
                        <option value="">-- Select Payment Method --</option>
                        <option value="cash">Cash</option>
                        <option value="venmo">Venmo (@olivern8)</option>
                        <option value="apple_pay">Apple Pay</option>
                      </select>
                    </div> */}

                    <div className="form-group">
                      <label htmlFor="notes">Additional Notes</label>
                      <textarea 
                        name="notes" 
                        id="notes" 
                        rows="4"
                        placeholder="Any special requests or additional information?"
                      ></textarea>
                    </div>

                    {/* <div className="form-group price-display">
                      <p>Total Price: <strong>${totalPrice}</strong></p>
                    </div> */}

                    <button type="submit" className="submit-button">Submit Order</button>
                  </form>
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

export default Order;
