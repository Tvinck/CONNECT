'use client'

/**
 * PriceChart.tsx — renders 7‑day and 30‑day price trends using Chart.js.
 * Uses react-chartjs-2 wrapper. Accepts an array of {date, price} objects.
 */

import { Line } from 'react-chartjs-2'
import { Chart, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend)

interface PricePoint {
  date: string // formatted "dd.MM"
  price: number
}

interface PriceChartProps {
  history: PricePoint[] // should be sorted oldest→newest
}

export function PriceChart({ history }: PriceChartProps) {
  const [range, setRange] = useState<'7d' | '30d'>('7d')

  // slice data based on range
  const dataPoints = range === '7d' ? history.slice(-7) : history.slice(-30)

  const chartData = {
    labels: dataPoints.map((p) => p.date),
    datasets: [
      {
        label: 'Цена (USD)',
        data: dataPoints.map((p) => p.price),
        borderColor: '#BFF128',
        backgroundColor: 'rgba(191,241,40,0.1)',
        tension: 0.2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `$${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#8E92BC' },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#8E92BC' },
      },
    },
  }

  return (
    <div className="bg-[#1C1D2A] border border-white/[0.04] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-[15px]">📈 Тренд цены</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setRange('7d')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              range === '7d' ? 'bg-[#BFF128]/20 text-[#BFF128]' : 'text-[#8E92BC] hover:bg-white/[0.04]'
            }`}
          >
            7 дней
          </button>
          <button
            onClick={() => setRange('30d')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              range === '30d' ? 'bg-[#BFF128]/20 text-[#BFF128]' : 'text-[#8E92BC] hover:bg-white/[0.04]'
            }`}
          >
            30 дней
          </button>
        </div>
      </div>
      <div className="h-56 w-full">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
