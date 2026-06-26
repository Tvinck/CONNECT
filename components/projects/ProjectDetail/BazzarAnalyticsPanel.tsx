'use client';

import { useState, useEffect } from 'react';
import { Activity, Users, Eye, ShoppingCart, CreditCard, Loader2 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getBazzarAnalytics } from '@/app/actions/bazzar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function BazzarAnalyticsPanel() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    const res = await getBazzarAnalytics();
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  const currentData = data.length > 0 ? data[data.length - 1] : {
    unique_visitors: 0,
    registrations: 0,
    views: 0,
    add_to_cart: 0,
    orders: 0
  };

  const prevData = data.length > 1 ? data[data.length - 2] : currentData;

  const metrics = [
    { label: 'Посетители', value: currentData.unique_visitors, icon: Users, color: 'text-blue-500' },
    { label: 'Регистрации', value: currentData.registrations, icon: Activity, color: 'text-purple-500' },
    { label: 'Просмотры', value: currentData.views, icon: Eye, color: 'text-orange-500' },
    { label: 'В корзине', value: currentData.add_to_cart, icon: ShoppingCart, color: 'text-pink-500' },
    { label: 'Заказы', value: currentData.orders, icon: CreditCard, color: 'text-ok' },
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#1C1D2A',
        titleColor: '#8E92BC',
        bodyColor: '#FFFFFF',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#8E92BC', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(142, 146, 188, 0.1)' },
        ticks: { color: '#8E92BC', font: { size: 11 } },
        beginAtZero: true,
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const chartData = {
    labels: data.map(d => d.date.split('-').slice(1).join('.')),
    datasets: [
      {
        label: 'Уникальные посетители',
        data: data.map(d => d.unique_visitors),
        borderColor: '#BFF128',
        backgroundColor: 'rgba(191, 241, 40, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#BFF128',
        pointBorderColor: '#13141C',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Регистрации (UDID)',
        data: data.map(d => d.registrations),
        borderColor: '#A855F7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#A855F7',
        pointBorderColor: '#13141C',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight">Аналитика Bazzar Certs</h2>
          <p className="text-mute text-[13px] mt-1">Отслеживание трафика, активности и конверсий магазина.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metrics.map((item, i) => (
          <div key={i} className="card p-4">
            <div className={`mb-2 ${item.color}`}>
              <item.icon size={20} />
            </div>
            <div className="text-[12px] text-mute font-medium">{item.label}</div>
            <div className="text-[20px] font-bold">{item.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="h-[300px] w-full">
          <Line options={chartOptions} data={chartData} />
        </div>
      </div>
    </div>
  );
}
