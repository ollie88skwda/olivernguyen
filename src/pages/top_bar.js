import React, { useState, useEffect, useCallback } from "react";
import on_logo from "../assets/on_logo.png";
export const Top_Bar = () => {
  const [showTopBar, setShowTopBar] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const SCROLL_TOP_THRESHOLD = 25; // Adjust this value to set the threshold near the top

  const handleScroll = useCallback(() => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop <= SCROLL_TOP_THRESHOLD) {
      // Near the top
      setShowTopBar(true);
    } else if (scrollTop > lastScrollTop) {
      // Scrolling down
      setShowTopBar(false);
    } else {
      // Scrolling up
      setShowTopBar(true);
    }
    setLastScrollTop(scrollTop);
  }, [lastScrollTop]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);
  return (
    <div class>
      <div className={`top-bar ${showTopBar ? "visible" : "hidden"}`}>
        <img src={on_logo} width="100px" alt="website logo" />
      </div>
    </div>
  );
};
