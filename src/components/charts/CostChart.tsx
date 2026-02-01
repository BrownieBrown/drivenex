'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import type { TCOResult } from '@/lib/calculations'

interface ComparisonData {
  name: string
  color: string
  tco: TCOResult
}

interface CostChartProps {
  data: ComparisonData[]
  years: number
}

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444']

export function CumulativeCostChart({ data, years }: CostChartProps) {
  const chartData = Array.from({ length: years }, (_, i) => {
    const year = i + 1
    const point: Record<string, number | string> = { year: `Year ${year}` }

    data.forEach((offer) => {
      const yearData = offer.tco.yearlyCosts[i]
      if (yearData) {
        point[offer.name] = Math.round(yearData.cumulative)
      }
    })

    return point
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          label={{ value: 'EUR', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          formatter={(value) => [`${Number(value).toLocaleString('de-DE')} EUR`, '']}
        />
        <Legend />
        {data.map((offer, index) => (
          <Line
            key={offer.name}
            type="monotone"
            dataKey={offer.name}
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function MonthlyCostBreakdownChart({ data }: { data: ComparisonData[] }) {
  const chartData = data.map((offer) => {
    const avgYear = offer.tco.yearlyCosts[0] || {
      monthlyPayment: 0,
      fuelCost: 0,
      insurance: 0,
      tax: 0,
      maintenance: 0,
      tires: 0,
    }

    return {
      name: offer.name,
      Payment: Math.round(avgYear.monthlyPayment / 12),
      Fuel: Math.round(avgYear.fuelCost / 12),
      Insurance: Math.round(avgYear.insurance / 12),
      Tax: Math.round(avgYear.tax / 12),
      Maintenance: Math.round(avgYear.maintenance / 12),
      Tires: Math.round(avgYear.tires / 12),
    }
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tickFormatter={(value) => `${value} EUR`} />
        <YAxis type="category" dataKey="name" width={120} />
        <Tooltip formatter={(value) => `${Number(value)} EUR/month`} />
        <Legend />
        <Bar dataKey="Payment" stackId="a" fill="#3B82F6" name="Monthly Payment" />
        <Bar dataKey="Fuel" stackId="a" fill="#10B981" name="Fuel/Electricity" />
        <Bar dataKey="Insurance" stackId="a" fill="#8B5CF6" name="Insurance" />
        <Bar dataKey="Tax" stackId="a" fill="#F59E0B" name="Tax" />
        <Bar dataKey="Maintenance" stackId="a" fill="#EF4444" name="Maintenance" />
        <Bar dataKey="Tires" stackId="a" fill="#6B7280" name="Tires" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function TotalCostComparisonChart({ data }: { data: ComparisonData[] }) {
  const chartData = data.map((offer, index) => ({
    name: offer.name,
    total: Math.round(offer.tco.totalCost),
    fill: COLORS[index % COLORS.length],
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          label={{ value: 'EUR', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          formatter={(value) => [`${Number(value).toLocaleString('de-DE')} EUR`, 'Total Cost']}
        />
        <Bar dataKey="total" name="Total Cost">
          {chartData.map((entry, index) => (
            <rect key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
