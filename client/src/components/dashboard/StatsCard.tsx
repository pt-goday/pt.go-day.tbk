import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  changeValue?: string;
  changeDirection?: "up" | "down" | "neutral";
  changeText?: string;
  progressValue?: number;
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  changeValue,
  changeDirection = "neutral",
  changeText,
  progressValue
}: StatsCardProps) {
  // Determine the color class for the change indicator
  const changeColorClass = changeDirection === "up" 
    ? "text-success" 
    : changeDirection === "down" 
      ? "text-danger" 
      : "text-gray-500";

  // Determine the icon for the change indicator
  const changeIcon = changeDirection === "up" 
    ? "ri-arrow-up-line" 
    : changeDirection === "down" 
      ? "ri-arrow-down-line" 
      : "";

  return (
    <motion.div 
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow p-6 card hover:shadow-md transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-primary">{value}</h3>
        </div>
        <div className={`p-2 ${iconBgColor} rounded-md`}>
          <i className={`${icon} ${iconColor} text-2xl`}></i>
        </div>
      </div>
      
      {changeValue && changeText && (
        <div className="flex items-center text-sm">
          <span className={`${changeColorClass} flex items-center`}>
            {changeIcon && <i className={`${changeIcon} mr-1`}></i>}
            {changeValue}
          </span>
          <span className="text-gray-500 ml-2">{changeText}</span>
        </div>
      )}
      
      {progressValue !== undefined && (
        <div className="flex items-center text-sm">
          <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="bg-purple-600 h-full rounded-full" 
              style={{ width: `${progressValue}%` }}
            ></div>
          </div>
          <span className="text-gray-500 ml-2">{progressValue}%</span>
        </div>
      )}
    </motion.div>
  );
}
