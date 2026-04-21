import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminGate } from "@/components/AdminGate";
import { AdminLayout, type AdminPanel } from "@/components/AdminLayout";
import { AdminContentProvider } from "@/contexts/AdminContentContext";
import { DashboardPanel } from "@/components/admin/DashboardPanel";
import { HeroPanel } from "@/components/admin/HeroPanel";
import { EventPanel } from "@/components/admin/EventPanel";
import { TicketsPanel } from "@/components/admin/TicketsPanel";
import {
  MerchPanel,
  PlaylistsPanel,
  BrandsPanel,
  TeamPanel,
  SiteSettingsPanel,
  AccessPanel,
} from "@/components/admin/AdminPanels";

export const Route = createFileRoute("/admin")({
  component: () => (
    <AdminGate>
      <AdminContentProvider>
        <AdminPage />
      </AdminContentProvider>
    </AdminGate>
  ),
  head: () => ({ meta: [{ title: "Admin — TheZuriXperience" }] }),
});

function AdminPage() {
  const [activePanel, setActivePanel] = useState<AdminPanel>("dashboard");

  return (
    <AdminLayout activePanel={activePanel} onNavigate={setActivePanel}>
      {activePanel === "dashboard" && <DashboardPanel onNavigate={setActivePanel} />}
      {activePanel === "hero" && <HeroPanel />}
      {activePanel === "event" && <EventPanel />}
      {activePanel === "tickets" && <TicketsPanel />}
      {activePanel === "merch" && <MerchPanel />}
      {activePanel === "playlists" && <PlaylistsPanel />}
      {activePanel === "brands" && <BrandsPanel />}
      {activePanel === "team" && <TeamPanel />}
      {activePanel === "settings" && <SiteSettingsPanel />}
      {activePanel === "access" && <AccessPanel />}
    </AdminLayout>
  );
}
