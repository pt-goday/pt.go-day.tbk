import { ReactNode } from "react";
import { motion } from "framer-motion";

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  periodOptions: string[];
  onPeriodChange: (period: string) => void;
  selectedPeriod: string;
}

export default function ChartContainer({
  title,
  children,
  periodOptions,
  onPeriodChange,
  selectedPeriod
}: ChartContainerProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-white rounded-lg shadow p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-primary">{title}</h3>
        <select 
          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none"
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value)}
        >
          {periodOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      
      <div className="chart-container h-[240px]">
        {children}
      </div>
    </motion.div>
  );
}
