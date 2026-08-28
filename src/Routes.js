import { BrowserRouter as Router, Switch, Route, useHistory, useLocation } from "react-router-dom";
import React, { Suspense, lazy } from "react";
import { SiteChrome as ChromeBar } from "./chrome/SiteChrome";
import { ModeProvider } from "./mode/ModeProvider";
import { ThemeProvider } from "./theme/ThemeProvider";
import { ClerkProvider } from "@clerk/react";
import { NotFoundPage } from "./pages/not_found_page.js";
import { SATResourcesError, SATResourcesLoading } from "./pages/sat/sat_route_states.jsx";
// X-1 (P4): src/pages/home.js is unmounted but left in the tree, flagged.
import Home from "./home/Home.jsx";
import RequirePassphrase from "./auth/RequirePassphrase";
import RequireClerk, { clerkKey } from "./auth/RequireClerk";

// X-3 perf budget (plan §6 FINAL GATE): "/" route JS ≤ 180KB gz pre-graph-
// chunk. Legacy routes are lazy so their page code never rides in the entry
// chunk; each renders under Suspense with a full-height fallback. Frozen legacy
// bodies stay unchanged unless a route-specific restyle owns their stylesheet.
const Permit = lazy(() =>
  import("./pages/driving/permit.js").then((m) => ({ default: m.Permit })),
);
const ArticleWriter = lazy(() =>
  import("./pages/archive/article_writer.js").then((m) => ({ default: m.ArticleWriter })),
);
const DriversLicense = lazy(() =>
  import("./pages/driving/drivers_license.js").then((m) => ({ default: m.DriversLicense })),
);
const SATResources = lazy(() =>
  import("./pages/sat/sat_resources.js").catch(() => ({ default: SATResourcesError })),
);
const SATSignup = lazy(() => import("./pages/sat/sat_signup.js"));
const Pull = lazy(() =>
  import("./pages/pull.js").then((m) => ({ default: m.Pull })),
);
const EmojiPage = lazy(() =>
  import("./pages/emoji.js").then((m) => ({ default: m.EmojiPage })),
);
const College = lazy(() => import("./pages/college/index.js"));
const SignInPage = lazy(() => import("./pages/sign_in.js"));
const BeMyGirlfriend = lazy(() => import("./pages/be_my_girlfriend/index.js"));
const Major = lazy(() => import("./pages/major/index.js"));
const Apply = lazy(() => import("./pages/apply/index.js"));
const EssayStudio = lazy(() => import("./pages/essay_studio/index.js"));
const WritingRoom = lazy(() => import("./pages/essay_studio/room/index.js"));
const Transfer = lazy(() => import("./pages/transfer/index.js"));
const MomFifty = lazy(() => import("./pages/mom/index.js"));

// Dev-only component gallery (/_components). Behind import.meta.env.DEV so the
// route, its chunk and the whole component-gallery tree are absent from a
// production build — it is a workbench, not a page. Not in the pages menu, and
// disallowed in public/robots.txt.
const ComponentGallery = import.meta.env.DEV
  ? lazy(() => import("./gallery/ComponentGallery.jsx"))
  : null;

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

// Site chrome (top bar, pages menu, mode toggle) is mounted once here so
// every route carries it. I-1.5: src/chrome/SiteChrome replaces the old
// pages/top_bar (grain retired, /debt dropped, TERM|GRAPH toggle added);
// top_bar.js stays in the tree unmounted (P4 policy).
// /be-my-girlfriend and the restored /mom + /mum page opt out of chrome.
const NO_CHROME = ["/be-my-girlfriend", "/bemygirlfriend", "/girlfriend", "/mom", "/mum"];

const NavigationBridge = () => {
  const history = useHistory();
  React.useEffect(() => {
    const onNavigate = (event) => {
      const href = event.detail;
      if (typeof href !== "string" || !href.startsWith("/")) return;
      event.preventDefault();
      history.push(href);
    };
    window.addEventListener("on:navigate", onNavigate);
    return () => window.removeEventListener("on:navigate", onNavigate);
  }, [history]);
  return null;
};

const SiteChrome = () => {
  const { pathname } = useLocation();
  if (NO_CHROME.some((route) => pathname.startsWith(route))) return null;
  return <ChromeBar />;
};

const Blank = () => <div style={{ minHeight: "100dvh" }} />;

const RouteFallback = () => {
  const { pathname } = useLocation();
  return pathname === "/sat-resources" ? <SATResourcesLoading /> : <Blank />;
};

const SATSignupLoading = () => (
  <main
    className="sakura"
    style={{ minHeight: "100dvh", background: "var(--bg)" }}
    aria-busy="true"
  />
);

export const Routes = () => {
  return (
    <Router>
      {/* D-19: two independent axes, two providers. ThemeProvider writes
          data-theme (the palette ladder), ModeProvider writes data-mode (the
          interface). Neither reads the other. */}
      <ThemeProvider>
      <ModeProvider>
      <NavigationBridge />
      <SiteChrome />
      <ClerkBridge>
      <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" exact>
          <Home />
        </Route>
        <Route path="/sign-in">
          <SignInPage />
        </Route>
        {ComponentGallery && (
          <Route path="/_components">
            <ComponentGallery />
          </Route>
        )}
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
          <Suspense fallback={<SATSignupLoading />}>
            <SATSignup />
          </Suspense>
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
        {/* /mom is canonical; /mum stays alive because the link was shared as /mum */}
        <Route path={["/mom", "/mum"]}>
          <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#2c0d45" }} />}>
            <MomFifty />
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
      </Suspense>
      </ClerkBridge>
      </ModeProvider>
      </ThemeProvider>
    </Router>
  );
};