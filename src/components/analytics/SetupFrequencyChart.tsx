import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Trade } from '../../types/trade'; // Assuming Trade type is exported from types
import { Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion'; // Import motion

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SetupFrequencyChartProps {
  trades: Trade[];
}

// Define a sleek color palette
const chartColors = [
  'rgba(96, 165, 250, 0.8)', // Blue-500 with opacity
  'rgba(74, 222, 128, 0.8)', // Green-500 with opacity
  'rgba(251, 146, 60, 0.8)', // Orange-500 with opacity
  'rgba(244, 63, 94, 0.8)',  // Rose-500 with opacity
  'rgba(165, 180, 252, 0.8)', // Indigo-400 with opacity
  'rgba(240, 147, 219, 0.8)', // Pink-400 with opacity
  'rgba(129, 140, 248, 0.8)', // Violet-400 with opacity
  'rgba(75, 192, 192, 0.8)', // Teal-400 with opacity
];

const SetupFrequencyChart: React.FC<SetupFrequencyChartProps> = ({ trades }) => {

  const chartData = useMemo(() => {
    // Count the frequency of each setup
    const setupCounts: { [key: string]: number } = {};
    trades.forEach(trade => {
      if (trade.setup) {
        setupCounts[trade.setup] = (setupCounts[trade.setup] || 0) + 1;
      }
    });

    // Sort setups by frequency descending
    const sortedSetups = Object.entries(setupCounts).sort(([, a], [, b]) => b - a);

    const labels = sortedSetups.map(([setup]) => setup);
    const data = sortedSetups.map(([, count]) => count);

    // Assign colors from the palette, repeating if necessary
    const backgroundColors = labels.map((_, index) => chartColors[index % chartColors.length]);
    // Use slightly darker borders for contrast
    const borderColors = backgroundColors.map(color => color.replace('0.8', '1'));

    return {
      labels,
      datasets: [
        {
          label: 'Number of Trades',
          data: data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4, // Rounded corners for bars
          categoryPercentage: 0.8, // Adjust bar thickness relative to category space
          barPercentage: 0.9, // Adjust bar thickness relative to available space
        },
      ],
    };
  }, [trades]);

  const options = {
    indexAxis: 'y' as const, // Set indexAxis to 'y' for horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        bodyColor: '#fff',
        titleColor: '#fff',
        borderColor: '#fff',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.raw !== null) {
              label += context.raw;
            }
            return label + ' trades';
          }
        }
      },
    },
    scales: {
      x: { // X-axis is now the value axis (number of trades)
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: '#666',
           // Hide many ticks if there are too many labels, let tooltip provide exact counts
           maxTicksLimit: 6,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
           // Keep only horizontal grid lines
           drawTicks: false, // Do not draw axis ticks
        },
        title: {
            display: true,
            text: 'Number of Trades',
            color: '#555',
        },
        max: 10, // Set a maximum value for the x-axis to make bars appear shorter
      },
       y: { // Y-axis is now the category axis (trade setups)
        ticks: {
          color: '#666',
           // mirror: true, // Remove mirror to place labels outside
           // padding: 10, // Remove padding
        },
        grid: {
          display: false,
          borderColor: 'rgba(0, 0, 0, 0.1)',
        },
        title: {
            display: false, // Hide Y-axis title for a cleaner look like the example
            // text: 'Trade Setup',
            // color: '#555',
        }
      }
    }
  };

  return (
    <Card className="border border-divider">
      <CardHeader className="flex gap-3 items-center">
          <Icon icon="lucide:bar-chart" className="text-xl text-primary-500" />
          <div className="flex flex-col">
              <p className="text-md font-semibold">Trade Setup Analysis</p>
              <p className="text-sm text-default-500">Frequency of different trading setups used.</p>
          </div>
      </CardHeader>
      <Divider/>
      <CardBody className="p-6">
        {/* Add a check for data to avoid rendering an empty chart */}
        {chartData.labels.length > 0 ? (
             // Add a div with a specific height to control the chart size
             // Wrap the chart in motion.div for animation
             <motion.div 
                style={{ height: '300px' }} // Slightly reduced height for compactness
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
             >
                <Bar data={chartData} options={options} />
             </motion.div>
        ) : (
            <div className="text-center text-default-500">No setup data available from trades.</div>
        )}
      </CardBody>
    </Card>
  );
};

export default SetupFrequencyChart;