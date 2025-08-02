import React, { useEffect } from "react";

export const DebtRedirect = () => {
  useEffect(() => {
    // Redirect to the external debt tracker site
    window.location.href = "https://debt-tracker-tau.vercel.app";
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2>Redirecting to Debt Tracker...</h2>
      <p>If you are not redirected automatically, <a href="https://debt-tracker-tau.vercel.app">click here</a>.</p>
    </div>
  );
};
