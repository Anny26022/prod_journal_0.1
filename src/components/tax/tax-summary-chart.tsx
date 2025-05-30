import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from "recharts";
import { useTrades } from "../../hooks/use-trades";

function getMonthShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('default', { month: 'short' });
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const TaxSummaryChart: React.FC = () => {
  const { trades } = useTrades();
  // Group trades by month
  const monthlyMap: Record<string, { grossPL: number; netPL: number; taxes: number }> = {};
  trades.forEach(trade => {
    const key = getMonthShort(trade.date);
    if (!monthlyMap[key]) monthlyMap[key] = { grossPL: 0, netPL: 0, taxes: 0 };
    monthlyMap[key].grossPL += trade.plRs || 0;
    // For now, taxes = 0, netPL = grossPL
    monthlyMap[key].netPL += trade.plRs || 0;
  });
  // Output months in calendar order
  const monthOrder = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const chartData = monthOrder.map(month => ({
    month,
    grossPL: monthlyMap[month]?.grossPL || 0,
    netPL: monthlyMap[month]?.netPL || 0,
    taxes: monthlyMap[month]?.taxes || 0,
    taxPercent: monthlyMap[month]?.grossPL ? (monthlyMap[month].taxes / Math.abs(monthlyMap[month].grossPL) * 100) : 0
  }));

  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--heroui-divider))" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            yAxisId="left"
            tickFormatter={(value) => formatCurrency(value)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => `${value}%`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "taxPercent") {
                return [`${value.toFixed(2)}%`, "Tax %"];
              }
              return [formatCurrency(value), name === "grossPL" ? "Gross P/L" : name === "netPL" ? "Net P/L" : "Taxes"];
            }}
            contentStyle={{
              backgroundColor: "hsl(var(--heroui-content1))",
              border: "1px solid hsl(var(--heroui-divider))",
              borderRadius: "8px",
              padding: "8px 12px"
            }}
          />
          <Legend />
          <ReferenceLine y={0} yAxisId="left" stroke="hsl(var(--heroui-divider))" />
          <Bar 
            yAxisId="left" 
            dataKey="grossPL" 
            name="Gross P/L" 
            fill="hsl(var(--heroui-primary-300))" 
            radius={[4, 4, 0, 0]} 
            barSize={20}
          />
          <Bar 
            yAxisId="left" 
            dataKey="netPL" 
            name="Net P/L" 
            fill="hsl(var(--heroui-success-500))" 
            radius={[4, 4, 0, 0]} 
            barSize={20}
          />
          <Bar 
            yAxisId="left" 
            dataKey="taxes" 
            name="Taxes" 
            fill="hsl(var(--heroui-danger-500))" 
            radius={[4, 4, 0, 0]} 
            barSize={20}
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="taxPercent" 
            name="Tax %" 
            stroke="hsl(var(--heroui-warning-500))" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};