import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import React, { Suspense, lazy } from "react";
import { Permit } from "./pages/driving/permit.js";
import { NotFoundPage } from "./pages/not_found_page.js";
import { Home } from "./pages/home.js";
import { ArticleWriter } from "./pages/archive/article_writer.js";
import { DriversLicense } from "./pages/driving/drivers_license.js";
import SATResources from "./pages/sat/sat_resources.js";
import SATSignup from "./pages/sat/sat_signup.js";
import { Pull } from "./pages/pull.js";
import { EmojiPage } from "./pages/emoji.js";
import RequirePassphrase from "./auth/RequirePassphrase";

const BeMyGirlfriend = lazy(() => import("./pages/be_my_girlfriend/index.js"));
const Major = lazy(() => import("./pages/major/index.js"));
const Apply = lazy(() => import("./pages/apply/index.js"));
const EssayStudio = lazy(() => import("./pages/essay_studio/index.js"));
const WritingRoom = lazy(() => import("./pages/essay_studio/room/index.js"));

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
        <Route path="/license">
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
        <Route path="/pull">
          <Pull />
        </Route>
        <Route path="/emoji">
          <EmojiPage />
        </Route>
        <Route path={["/be-my-girlfriend", "/bemygirlfriend", "/girlfriend"]}>
          <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#092441" }} />}>
            <BeMyGirlfriend />
          </Suspense>
        </Route>
        <Route path="/major">
          <RequirePassphrase label="Route /major · private" route="/major">
            <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#f1e9d4" }} />}>
              <Major />
            </Suspense>
          </RequirePassphrase>
        </Route>
        <Route path="/apply">
          <RequirePassphrase label="Route /apply · private" route="/apply">
            <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#f1e9d4" }} />}>
              <Apply />
            </Suspense>
          </RequirePassphrase>
        </Route>
        <Route path="/studio/:schoolSlug/:promptSlug/:versionKey">
          <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#f1e9d4" }} />}>
            <WritingRoom />
          </Suspense>
        </Route>
        <Route path="/studio">
          <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#f1e9d4" }} />}>
            <EssayStudio />
          </Suspense>
        </Route>
        <Route>
          <NotFoundPage />
        </Route>
      </Switch>
    </Router>
  );
};