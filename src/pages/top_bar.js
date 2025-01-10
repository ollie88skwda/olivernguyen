import React, { useState, useEffect, useCallback } from "react";
import on_logo from "../assets/on_logo.png";
import "../Top_Bar.css";

export const TopBar = () => {
  const [showTopBar, setShowTopBar] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDrivingOpen, setIsDrivingOpen] = useState(false);
  const [isSATOpen, setIsSATOpen] = useState(false);
  const SCROLL_TOP_THRESHOLD = 25;
  const topBarHeight = 67;

  const handleScroll = useCallback(() => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop <= SCROLL_TOP_THRESHOLD) {
      setShowTopBar(true);
    } else if (scrollTop > lastScrollTop) {
      setShowTopBar(false);
    } else {
      setShowTopBar(true);
    }

    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      if (scrollTop > lastScrollTop) {
        sidebar.style.top = `${-topBarHeight}px`;
      } else {
        sidebar.style.top = "0";
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

  const toggleDriving = () => {
    setIsDrivingOpen(!isDrivingOpen);
  };

  const toggleSAT = () => {
    setIsSATOpen(!isSATOpen);
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
          ☰
        </button>
      </div>
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <ul>
          <li>
            <a href="/" className="sidebar-link">
              Home
            </a>
          </li>
          <li className={`dropdown ${isDrivingOpen ? 'open' : ''}`}>
            <button onClick={toggleDriving} className="dropdown-toggle">
              Driving
              <span className="dropdown-icon">+</span>
            </button>
            <div className="dropdown-content">
              <li>
                <a href="/permit" className="sidebar-link">
                  Permit
                </a>
              </li>
              <li>
                <a href="/drivers-license" className="sidebar-link">
                  License
                </a>
              </li>
            </div>
          </li>
          <li className={`dropdown ${isSATOpen ? 'open' : ''}`}>
            <button onClick={toggleSAT} className="dropdown-toggle">
              SAT
              <span className="dropdown-icon">+</span>
            </button>
            <div className="dropdown-content">
              <li>
                <a href="/sat-resources" className="sidebar-link">
                  Resources
                </a>
              </li>
              <li>
                <a href="/sat-signup" className="sidebar-link">
                  Sign Up
                </a>
              </li>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};
