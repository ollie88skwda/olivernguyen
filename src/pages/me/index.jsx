import React from "react";
import { ArrowUpRight, BookOpenText, CalendarClock, FileText, FlaskConical, GraduationCap, HeartPulse, Repeat } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Display, MonoLabel } from "@/components/brand";
import "./me.css";

// /me: one owner-only page linking every private surface on the site.
// Gated by RequireOwner in Routes.js (server-checked owner id). Each linked
// page keeps its own gate; this page only collects the links.
const PAGES = [
  { href: "/verifier", title: "The Verifier", body: "How the agent setup is doing, proposals and experiments.", icon: FlaskConical, gate: "Owner sign-in" },
  { href: "/studio", title: "Essay Studio", body: "College essays, drafts and versions.", icon: BookOpenText, gate: "Sign-in" },
  { href: "/transfer", title: "Transfer", body: "Move files between devices.", icon: Repeat, gate: "Sign-in" },
  { href: "/tracker", title: "Life tracker", body: "Daily tracking.", icon: HeartPulse, gate: "Owner sign-in" },
  { href: "/time-blocks", title: "Time blocks", body: "Plan the day in blocks.", icon: CalendarClock, gate: "Owner sign-in" },
  { href: "/major", title: "Major", body: "Major research.", icon: GraduationCap, gate: "Passphrase" },
  { href: "/apply", title: "Apply", body: "Application tracker.", icon: FileText, gate: "Passphrase" },
];

export default function OwnerHub() {
  return (
    <main className="me-page sakura">
      <div className="me-shell">
        <header className="me-header">
          <MonoLabel>Private · only you</MonoLabel>
          <Display>Your pages</Display>
        </header>
        <nav className="me-grid" aria-label="Private pages">
          {PAGES.map(({ href, title, body, icon: Icon, gate }) => (
            <a key={href} href={href} className="me-link">
              <Card interactive>
                <CardHeader>
                  <div className="me-row">
                    <Icon aria-hidden="true" size={20} />
                    <MonoLabel tone="muted">{gate}</MonoLabel>
                  </div>
                  <CardTitle>{title} <ArrowUpRight aria-hidden="true" size={16} className="me-arrow" /></CardTitle>
                  <CardDescription>{body}</CardDescription>
                  <MonoLabel tone="muted">{href}</MonoLabel>
                </CardHeader>
              </Card>
            </a>
          ))}
        </nav>
      </div>
    </main>
  );
}
