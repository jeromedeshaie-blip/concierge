"use server";

import { createClient } from "@/lib/supabase/server";

export interface DashboardStats {
  total_properties: number;
  active_bookings: number;
  pending_tasks: number;
  revenue_month: number;
}

export interface Movement {
  id: string;
  guest_name: string;
  property_name: string;
  check_in?: string;
  check_out?: string;
}

export interface TodayMovements {
  arrivals: Movement[];
  departures: Movement[];
}

export interface OccupationDay {
  day_date: string;
  label: string;
  occupation_pct: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dashboard_stats");
  if (error) {
    console.error("getDashboardStats error:", error);
    return { total_properties: 0, active_bookings: 0, pending_tasks: 0, revenue_month: 0 };
  }
  return data as DashboardStats;
}

export async function getTodayMovements(): Promise<TodayMovements> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_today_movements");
  if (error) {
    console.error("getTodayMovements error:", error);
    return { arrivals: [], departures: [] };
  }
  return data as TodayMovements;
}

export async function getOccupation7Days(): Promise<OccupationDay[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_occupation_7days");
  if (error) {
    console.error("getOccupation7Days error:", error);
    return [];
  }
  return (data as OccupationDay[]) ?? [];
}
