import { BrowserRouter as Router, Switch, Route, useHistory, useLocation } from "react-router-dom";
import React, { Suspense, lazy } from "react";
import { TopBar } from "./pages/top_bar";
import { ClerkProvider } from "@clerk/react";
import { Permit } from "./pages/driving/permit.js";
import { NotFoundPage } from "./pages/not_found_page.js";
import { Home } from "./pages/home.js";
import { ArticleWriter } from "./pages/archive/article_writer.js";
import { DriversLicense } from "./pages/driving/drivers_license.js";
import SATResources from "./pages/sat/sat_resources.js";
import SATSignup from "./pages/sat/sat_signup.js";
import { Pull } from "./pages/pull.js";
import { EmojiPage } from "./pages/emoji.js";
import College from "./pages/college/index.js";
import SignInPage from "./pages/sign_in.js";
import RequirePassphrase from "./auth/RequirePassphrase";
import RequireClerk, { clerkKey } from "./auth/RequireClerk";

const BeMyGirlfriend = lazy(() => import("./pages/be_my_girlfriend/index.js"));
const Major = lazy(() => import("./pages/major/index.js"));
const Apply = lazy(() => import("./pages/apply/index.js"));
const EssayStudio = lazy(() => import("./pages/essay_studio/index.js"));
const WritingRoom = lazy(() => import("./pages/essay_studio/room/index.js"));
const Transfer = lazy(() => import("./pages/transfer/index.js"));

// ClerkProvider needs router functions, and those need useHistory, which only
// works inside <Router>. Hence a component between Router and Switch rather than
// wrapping the app in index.js. routerPush and routerReplace are a union in
// Clerk's types: both or neither.
//
// Mounted only when a key exists. ClerkProvider throws on construction without
// one, which would take /college, /major and /apply down with it.
const ClerkBridge = ({ children }) => {
  const history = useHistory();
  if (!clerkKey()) return children;
  return (
    <ClerkProvider
      publishableKey={clerkKey()}
      afterSignOutUrl="/college"
      routerPush={(to) => history.push(to)}
      routerReplace={(to) => history.replace(to)}
    >
      {children}
    </ClerkProvider>
  );
};

// Site chrome (top bar, sidebar, grain, scroll progress) is mounted once here so
// every route carries it, instead of each page importing TopBar itself.
// /be-my-girlfriend is full-bleed with its own art direction and opts out.
const NO_CHROME = ["/be-my-girlfriend", "/bemygirlfriend", "/girlfriend"];

const SiteChrome = () => {
  const { pathname } = useLocation();
  if (NO_CHROME.some((route) => pathname.startsWith(route))) return null;
  return <TopBar />;
};

export const Routes = () => {
  return (
    <Router>
      <SiteChrome />
      <ClerkBridge>
      <Switch>
        <Route path="/" exact>
          <Home />
        </Route>
        <Route path="/sign-in">
          <SignInPage />
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
        <Route path="/college">
          <College />
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
          <RequireClerk>
            <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#f1e9d4" }} />}>
              <WritingRoom />
            </Suspense>
          </RequireClerk>
        </Route>
        <Route path="/studio">
          <RequireClerk>
            <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#f1e9d4" }} />}>
              <EssayStudio />
            </Suspense>
          </RequireClerk>
        </Route>
        <Route path="/transfer">
          <RequireClerk>
            <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#f1e9d4" }} />}>
              <Transfer />
            </Suspense>
          </RequireClerk>
        </Route>
        <Route>
          <NotFoundPage />
        </Route>
      </Switch>
      </ClerkBridge>
    </Router>
  );
};