import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Driving } from "./pages/driving.js";
import { NotFoundPage } from "./pages/not_found_page.js";
import { Home } from "./pages/home.js";
import { ArticleWriter } from "./pages/article_writer.js";
export const Routes = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact>
          <Home />
        </Route>
        <Route path="/driving">
          <Driving />
        </Route>
        <Route path="/articlewriter">
          <ArticleWriter />
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
