'use client'
import type { BlockProps } from '@agnostic/core'
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Chart({ block, records, api }: BlockProps) {
  const chartRecords = records || [];
  const config = (block.config || {}) as Record<string, unknown>;
  const labelKey = typeof config.label_key === 'string' ? config.label_key : '';
  const dataKey = typeof config.data_key === 'string' ? config.data_key : '';
  const data = {
    labels: chartRecords.map((r) => r.data[labelKey] || r.id),
    datasets: [
      {
        label: String(config.dataset_label || 'Dataset'),
        data: chartRecords.map((r) => Number(r.data[dataKey] || 0)),
        backgroundColor: 'rgba(255, 184, 0, 0.6)',
        borderColor: 'rgba(255, 184, 0, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: String(config.title || 'Gráfico'),
      },
    },
  };

  return <Bar options={options} data={data} />;
}
