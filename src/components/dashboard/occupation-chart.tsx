"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OccupationDay } from "@/lib/actions/dashboard";

interface OccupationChartProps {
  data: OccupationDay[];
}

export function OccupationChart({ data }: OccupationChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Taux d&apos;occupation — 7 prochains jours
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [`${value}%`, "Occupation"]}
            />
            <Bar
              dataKey="occupation_pct"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
