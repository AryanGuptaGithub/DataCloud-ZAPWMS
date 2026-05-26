// src/components/TrendChart.jsx
import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  format, startOfMonth, endOfMonth,
  eachMonthOfInterval, subMonths,
} from "date-fns";

const fmt = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

export default function TrendChart({ records, color = "#10B981", label = "Total" }) {
  const chartData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return months.map((month) => {
      const start = startOfMonth(month);
      const end   = endOfMonth(month);

      const slice = records.filter((r) => {
        const d = new Date(r.date);
        return d >= start && d <= end;
      });

      const total = slice.reduce((s, r) => s + (r.amount || 0), 0);
      const count = slice.length;

      return {
        name:    format(month, "MMM"),
        month:   format(month, "MMMM yyyy"),
        total:   Math.round(total),
        count,
      };
    });
  }, [records]);

  const CustomTooltip = ({ active, payload, label: lbl }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-gray-700 mb-1">{payload[0]?.payload?.month}</p>
        <p style={{ color }}>{label}: {fmt(payload[0]?.value ?? 0)}</p>
        <p className="text-gray-400">{payload[0]?.payload?.count} transaction{payload[0]?.payload?.count !== 1 ? "s" : ""}</p>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <p className="text-sm font-semibold text-gray-700 mb-4">
        Last 6 Months — {label}
      </p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F9FAFB" }} />
            <Bar dataKey="total" name={label} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}