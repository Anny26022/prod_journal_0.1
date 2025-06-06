import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Card, CardBody, CardHeader } from "@heroui/react";
import { motion } from 'framer-motion';

interface ChartData {
  name: string;
  trades: number;
  stockNames?: string[];
}

interface Props {
  data: ChartData[];
  colors: string[];
  title: string;
}

const CustomLegend = ({ payload }: { payload: any[] }) => (
    <div className="flex flex-wrap justify-center items-center gap-x-4 sm:gap-x-6 gap-y-2 mb-4">
        {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs font-medium text-default-600 dark:text-default-400">{entry.value}</span>
            </div>
        ))}
    </div>
);

const IndustryDistributionChart: React.FC<Props> = ({ data, colors, title }) => {
  const chartData = React.useMemo(() => {
    const totalTrades = data.reduce((sum, item) => sum + item.trades, 0);
    return data.map((item, index) => ({
      ...item,
      percentage: totalTrades > 0 ? (item.trades / totalTrades) * 100 : 0,
      fill: colors[index % colors.length],
    })).sort((a,b) => b.percentage - a.percentage).slice(0, 5); // Take top 5
  }, [data, colors]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const stockNames = data.stockNames || [];
      return (
        <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg max-w-xs">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{data.name}</p>
          {stockNames.length > 0 && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug break-words">
                {stockNames.join(', ')}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };
  
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent * 100 < 5) return null;

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold pointer-events-none">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="will-change-transform"
    >
      <Card className="border-divider bg-content1">
        <CardHeader>
            <h2 className="text-lg font-bold text-default-700">{title} Analysis</h2>
        </CardHeader>
        <CardBody className="p-4 sm:p-6">
            <CustomLegend payload={chartData.map(item => ({ value: item.name, type: 'circle', color: item.fill }))} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mt-6">
                <div className="w-full">
                    <h3 className="text-md font-semibold text-center text-default-600 mb-2">{title} Distribution</h3>
                     <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                innerRadius="60%"
                                outerRadius="85%"
                                dataKey="trades"
                                stroke="none"
                                paddingAngle={2}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                </div>
                <div className="w-full">
                    <h3 className="text-md font-semibold text-center text-default-600 mb-4">Top {title}s</h3>
                     <ResponsiveContainer width="100%" height={280}>
                        <BarChart 
                            data={chartData} 
                            layout="vertical" 
                            margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" horizontal={false} />
                            <XAxis 
                                type="number" 
                                tickFormatter={(tick) => `${Math.round(tick)}%`} 
                                domain={[0, 'dataMax']} 
                                tick={{ fontSize: 11, fill: 'hsl(var(--nextui-default-500))' }} 
                                axisLine={false} 
                                tickLine={false}
                                tickCount={5}
                            />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={120} 
                              tick={{ fontSize: 12, fill: 'hsl(var(--nextui-default-700))', fontWeight: 600 }} 
                              axisLine={false} 
                              tickLine={false}
                              interval={0}
                              tickFormatter={(value) => value.length > 18 ? `${value.substring(0, 17)}...` : value}
                            />
                            <RechartsTooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                            <Bar dataKey="percentage" barSize={15} radius={[0, 8, 8, 0]}>
                               {chartData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                </div>
            </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default IndustryDistributionChart; 