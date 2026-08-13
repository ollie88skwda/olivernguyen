import React, { useState, useEffect, useCallback } from "react";
import "../styles/Top_Bar.css";
import ScrollProgress from "../components/ScrollProgress";

export const TopBar = () => {
  const [showTopBar, setShowTopBar] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollegeOpen, setIsCollegeOpen] = useState(false);
  const [isDrivingOpen, setIsDrivingOpen] = useState(false);
  const [isSATOpen, setIsSATOpen] = useState(false);
  const SCROLL_TOP_THRESHOLD = 25;
  const topBarHeight = 67;

  useEffect(() => {
    // Always show top bar and set initial load
    setShowTopBar(true);
    setIsInitialLoad(true);
    
    // Set initial load to false after animation completes
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

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
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [handleScroll]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleCollege = () => {
    setIsCollegeOpen(!isCollegeOpen);
  };

  const toggleDriving = () => {
    setIsDrivingOpen(!isDrivingOpen);
  };

  const toggleSAT = () => {
    setIsSATOpen(!isSATOpen);
  };

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <ScrollProgress />
      <div
        className={`top-bar ${showTopBar ? "show-bar" : "hide-bar"} ${isInitialLoad ? "initial-load" : ""}`}
      >
        <a href="/" className="on-logo wordmark">
          oN.c
        </a>
        <div className="top-bar-right">
          <span className="topbar-status">
            <span className="status-dot" aria-hidden="true" />
            College-bound · open to opportunities
          </span>
          <button
            onClick={toggleSidebar}
            className="sidebar-toggle-btn"
            aria-label="Open menu"
            aria-expanded={isSidebarOpen}
            aria-controls="site-sidebar"
          >
            ☰
          </button>
        </div>
      </div>
      <div
        id="site-sidebar"
        className={`sidebar ${isSidebarOpen ? "open" : ""}`}
        aria-label="Site navigation"
      >
        <ul>
          <li>
            <a href="/" className="sidebar-link">
              Home
            </a>
          </li>
          <li>
            <a href="/pull" className="sidebar-link">
              PULL
            </a>
          </li>
          <li>
            <a href="/debt" className="sidebar-link">
              Debt Tracker
            </a>
          </li>
          <li className={`dropdown split ${isCollegeOpen ? 'open' : ''}`}>
            <div className="dropdown-row">
              <a href="/college" className="sidebar-link">
                College
              </a>
              <button
                onClick={toggleCollege}
                className="dropdown-toggle icon-only"
                aria-expanded={isCollegeOpen}
                aria-label="Show college pages"
              >
                <span className="dropdown-icon">+</span>
              </button>
            </div>
            <ul className="dropdown-content">
              <li>
                <a href="/major" className="sidebar-link">
                  Major
                </a>
              </li>
              <li>
                <a href="/apply" className="sidebar-link">
                  Apply
                </a>
              </li>
              <li>
                <a href="/studio" className="sidebar-link">
                  Studio
                </a>
              </li>
              <li>
                <a href="/transfer" className="sidebar-link">
                  Transfer
                </a>
              </li>
            </ul>
          </li>
          <li className={`dropdown ${isDrivingOpen ? 'open' : ''}`}>
            <button onClick={toggleDriving} className="dropdown-toggle" aria-expanded={isDrivingOpen}>
              Driving
              <span className="dropdown-icon">+</span>
            </button>
            <ul className="dropdown-content">
              <li>
                <a href="/permit" className="sidebar-link">
                  Permit
                </a>
              </li>
              <li>
                <a href="/license" className="sidebar-link">
                  License
                </a>
              </li>
            </ul>
          </li>
          <li className={`dropdown ${isSATOpen ? 'open' : ''}`}>
            <button onClick={toggleSAT} className="dropdown-toggle" aria-expanded={isSATOpen}>
              SAT
              <span className="dropdown-icon">+</span>
            </button>
            <ul className="dropdown-content">
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
            </ul>
          </li>
        </ul>
      </div>
    </>
  );
};