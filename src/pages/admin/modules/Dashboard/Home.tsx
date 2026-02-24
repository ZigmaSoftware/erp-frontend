import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GIcon } from "@/components/ui/gicon";
import {
  continentApi,
  countryApi,
  stateApi,
  districtApi,
  cityApi,
  userCreationApi,
  userRoleApi
} from "@/helpers/admin";

import { MetricCard } from "./MetricCard";
import { DashboardSection } from "./DashboardSection";

/* -----------------------------------------
   TYPES
----------------------------------------- */
interface DashboardStats {
  masterData: Record<string, number>;
  users: Record<string, number>;
  adminSetup: Record<string, number>;
}

/* -----------------------------------------
   COMPONENT
----------------------------------------- */
export default function AdminHome() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    masterData: {},
    users: {},
    adminSetup: {},
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /* -----------------------------------------
     DATA FETCH
  ----------------------------------------- */
  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const requests = [
        continentApi.list(), 
        countryApi.list(),
        stateApi.list(), 
        districtApi.list(), 
        cityApi.list(), 
        userCreationApi.list(), 
        userRoleApi.list(), 
      ];

      const results = await Promise.allSettled(requests);

      const pick = <T,>(i: number): T[] =>
        results[i]?.status === "fulfilled" ? results[i].value : [];

      const users = pick<any>(6);

      setStats({
        masterData: {
          Continents: pick<any>(0).length,
          Countries: pick<any>(1).length,
          States: pick<any>(2).length,
          Districts: pick<any>(3).length,
          Cities: pick<any>(4).length,
          "Staff Created": pick<any>(5).length,
        },
        users: {
          "Total Users": users.length,
          "User Types": pick<any>(7).length,
          "Staff User Types": pick<any>(8).length,
        },
        adminSetup: {
          "Main Screen Types": pick<any>(9).length,
          "Main Screens": pick<any>(10).length,
          "User Screens": pick<any>(11).length,
          "Screen Actions": pick<any>(12).length,
          Permissions: pick<any>(13).length,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------
     DERIVED DATA
  ----------------------------------------- */
  const totalMaster = Object.values(stats.masterData).reduce((a, b) => a + b, 0);
  const totalAdminSetup = Object.values(stats.adminSetup).reduce((a, b) => a + b, 0);

  /* -----------------------------------------
     UI
  ----------------------------------------- */
  return (
    <div className="space-y-8 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Centralized operational intelligence
          </p>
        </div>
        <Button variant="outline" onClick={fetchDashboardData}>
          <GIcon name="refresh" className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* KPI STRIP */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Master Data" value={totalMaster} icon="public" loading={loading} />
        <MetricCard title="Total Users" value={stats.users["Total Users"] || 0} icon="group" loading={loading} />
        <MetricCard title="Admin Setup Items" value={totalAdminSetup} icon="assignment" loading={loading} />
        <MetricCard title="Staff Created" value={stats.masterData["Staff Created"] || 0} icon="badge" loading={loading} />
      </div>

      {/* DETAIL SECTIONS */}
      <DashboardSection title="Master Data" icon="location_on">
        {Object.entries(stats.masterData).map(([k, v]) => (
          <MetricCard key={k} title={k} value={v} icon="database" loading={loading} />
        ))}
      </DashboardSection>

      <DashboardSection title="User Management" icon="people">
        {Object.entries(stats.users).map(([k, v]) => (
          <MetricCard key={k} title={k} value={v} icon="person" loading={loading} />
        ))}
      </DashboardSection>

      <DashboardSection title="Admin Setup" icon="settings">
        {Object.entries(stats.adminSetup).map(([k, v]) => (
          <MetricCard key={k} title={k} value={v} icon="check_circle" loading={loading} />
        ))}
      </DashboardSection>
    </div>
  );
}
