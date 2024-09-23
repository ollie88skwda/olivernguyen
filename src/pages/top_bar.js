import React, { useState, useEffect, useCallback } from "react";
import on_logo from "../assets/on_logo.png";
import "../Top_Bar.css";

export const TopBar = () => {
  const [showTopBar, setShowTopBar] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const SCROLL_TOP_THRESHOLD = 25; // Adjust this value to set the threshold near the top
  const topBarHeight = 67; // The height of the top bar

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

    // Adjust sidebar position when scrolling down and top bar is hidden
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      if (scrollTop > lastScrollTop) {
        sidebar.style.top = `${-topBarHeight}px`; // Move sidebar up by the height of the top bar
      } else {
        sidebar.style.top = "0"; // Reset sidebar position when scrolling up
      }
    }

    setLastScrollTop(scrollTop);
  }, [lastScrollTop]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div>
      <div className={`top-bar ${showTopBar ? "visible" : "hidden"}`}>
        <a href="../">
          <img
            src={on_logo}
            width="100px"
            alt="website logo"
            className="on-logo"
          />
        </a>
        <button onClick={toggleSidebar} className="sidebar-toggle-btn">
          ☰{/* Sidebar toggle icon */}
        </button>
      </div>
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        {/* Sidebar content */}
        <ul>
          <li>
            <a href="/" className="sidebar-link">
              Home
            </a>
          </li>
          <li>
            <a href="/driving" className="sidebar-link">
              Driving
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};
