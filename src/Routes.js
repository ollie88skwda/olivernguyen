import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import React from 'react';
import { Permit } from "./pages/driving/permit.js";
import { NotFoundPage } from "./pages/not_found_page.js";
import { Home } from "./pages/home.js";
import { ArticleWriter } from "./pages/archive/article_writer.js";
import { DriversLicense } from "./pages/driving/drivers_license.js";
import SATResources from "./pages/sat/sat_resources.js";
import SATSignup from "./pages/sat/sat_signup.js";

export const Routes = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact>
          <Home />
        </Route>
        <Route path="/permit">
          <Permit />
        </Route>
        <Route path="/drivers-license">
          <DriversLicense />
        </Route>
        <Route path="/articlewriter">
          <ArticleWriter />
        </Route>
        <Route path="/sat-resources">
          <SATResources />
        </Route>
        <Route path="/sat-signup">
          <SATSignup />
        </Route>
        <Route>
          <NotFoundPage />
        </Route>
      </Switch>
    </Router>
  );
};
// import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// <Router>
//   <Link to="/driving">Driving</Link>
//   <Link to="/not_found_page">Not Found</Link>

//   <Routes>
//     <Route path="/driving" element={<driving />} />
//     <Route path="/not_found_page" element={<not_found_page />} />
//   </Routes>
// </Router>;
