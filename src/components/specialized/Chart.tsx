'use client'
import type { BlockProps } from 'packages/core/src/types'
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
  const data = {
    labels: records.map(r => r.data[block.config?.label_key] || r.id),
    datasets: [
      {
        label: block.config?.dataset_label || 'Dataset',
        data: records.map(r => r.data[block.config?.data_key] || 0),
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
        text: block.config?.title || 'Gráfico',
      },
    },
  };

  return <Bar options={options} data={data} />;
}
