import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import ChartContainer from "@/components/dashboard/ChartContainer";
import DataTable from "@/components/tables/DataTable";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, AreaChart, Area
} from "recharts";

// Sample data - would come from API in production
const dailyData = [
  { day: 'Mon', sales: 2400 },
  { day: 'Tue', sales: 1398 },
  { day: 'Wed', sales: 9800 },
  { day: 'Thu', sales: 3908 },
  { day: 'Fri', sales: 4800 },
  { day: 'Sat', sales: 3800 },
  { day: 'Sun', sales: 4300 },
];

const weeklyData = [
  { week: 'Week 1', sales: 4000, target: 5000 },
  { week: 'Week 2', sales: 3000, target: 5000 },
  { week: 'Week 3', sales: 5000, target: 5000 },
  { week: 'Week 4', sales: 7000, target: 5000 },
];

const monthlyData = [
  { month: 'Jan', sales: 4000, target: 3000 },
  { month: 'Feb', sales: 3000, target: 3000 },
  { month: 'Mar', sales: 2000, target: 3000 },
  { month: 'Apr', sales: 2780, target: 3000 },
  { month: 'May', sales: 1890, target: 3000 },
  { month: 'Jun', sales: 2390, target: 3000 },
];

const recentActivities = [
  {
    id: 1,
    employeeName: 'Sarah Johnson',
    employeeRole: 'Sales Manager',
    activity: 'Completed daily sales report',
    status: 'Completed',
    date: 'Today, 9:41 AM',
  },
  {
    id: 2,
    employeeName: 'Alex Chen',
    employeeRole: 'Marketing Specialist',
    activity: 'Submitted weekly marketing analysis',
    status: 'Completed',
    date: 'Today, 8:23 AM',
  },
  {
    id: 3,
    employeeName: 'Michael Torres',
    employeeRole: 'Sales Representative',
    activity: 'Logged 5 new sales',
    status: 'In Progress',
    date: 'Yesterday, 4:15 PM',
  },
  {
    id: 4,
    employeeName: 'Aisha Williams',
    employeeRole: 'HR Manager',
    activity: 'Updated attendance records',
    status: 'Review Needed',
    date: 'Yesterday, 2:00 PM',
  },
];

export default function DashboardPage() {
  const [dailyStatsFilter, setDailyStatsFilter] = useState("Last 7 days");
  const [weeklyStatsFilter, setWeeklyStatsFilter] = useState("This Month");
  const [monthlyStatsFilter, setMonthlyStatsFilter] = useState("This Year");
  const [currentPage, setCurrentPage] = useState(1);
  
  // In a real application, this would fetch data from the server
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    staleTime: 60 * 1000, // 1 minute
    initialData: {
      totalSales: "Rp 45,750,000",
      attendance: "97.8%",
      target: "85.2%",
      workCompleted: "42/50"
    }
  });
  
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/dashboard/activities', currentPage],
    staleTime: 30 * 1000, // 30 seconds
    initialData: {
      activities: recentActivities,
      totalCount: 12
    }
  });

  const activityColumns = [
    {
      header: "Employee",
      accessor: (item: typeof recentActivities[0]) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-500 font-medium">{item.employeeName.charAt(0)}</span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-primary">{item.employeeName}</div>
            <div className="text-xs text-gray-500">{item.employeeRole}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Activity",
      accessor: (item: typeof recentActivities[0]) => (
        <div className="text-sm text-primary">{item.activity}</div>
      ),
    },
    {
      header: "Status",
      accessor: (item: typeof recentActivities[0]) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
          {item.status}
        </span>
      ),
    },
    {
      header: "Date",
      accessor: "date",
      className: "text-sm text-gray-500",
    },
    {
      header: "Action",
      accessor: () => (
        <a href="#" className="text-primary hover:text-indigo-900">View Details</a>
      ),
      className: "text-right text-sm font-medium",
    },
  ];

  return (
    <PageLayout title="Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="Total Sales" 
          value={statsData?.totalSales ?? "Loading..."}
          icon="ri-shopping-bag-line" 
          iconBgColor="bg-green-100" 
          iconColor="text-success"
          changeValue="12.5%"
          changeDirection="up"
          changeText="from last month"
        />
        
        <StatsCard 
          title="Attendance" 
          value={statsData?.attendance ?? "Loading..."}
          icon="ri-user-follow-line" 
          iconBgColor="bg-blue-100" 
          iconColor="text-info"
          changeValue="2.3%"
          changeDirection="up"
          changeText="from last week"
        />
        
        <StatsCard 
          title="Target" 
          value={statsData?.target ?? "Loading..."}
          icon="ri-target-line" 
          iconBgColor="bg-yellow-100" 
          iconColor="text-warning"
          changeValue="4.1%"
          changeDirection="down"
          changeText="from goal"
        />
        
        <StatsCard 
          title="Completed Tasks" 
          value={statsData?.workCompleted ?? "Loading..."}
          icon="ri-file-list-3-line" 
          iconBgColor="bg-purple-100" 
          iconColor="text-purple-600"
          progressValue={84}
        />
      </div>
      
      {/* Charts Section */}
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartContainer
            title="Daily Sales"
            periodOptions={["Last 7 days", "Last 14 days", "Last 30 days"]}
            onPeriodChange={setDailyStatsFilter}
            selectedPeriod={dailyStatsFilter}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="sales" stroke="#111827" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          <ChartContainer
            title="Weekly Performance"
            periodOptions={["This Month", "Last Month", "Last Quarter"]}
            onPeriodChange={setWeeklyStatsFilter}
            selectedPeriod={weeklyStatsFilter}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="sales" fill="#111827" />
                <Bar dataKey="target" fill="#9ca3af" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          <ChartContainer
            title="Monthly Trends"
            periodOptions={["This Year", "Last Year", "Compare Years"]}
            onPeriodChange={setMonthlyStatsFilter}
            selectedPeriod={monthlyStatsFilter}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area type="monotone" dataKey="sales" stroke="#111827" fill="#111827" fillOpacity={0.2} />
                <Area type="monotone" dataKey="target" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
      
      {/* Recent Activities Table */}
      <DataTable
        title="Recent Activities"
        columns={activityColumns}
        data={activitiesData?.activities ?? []}
        totalItems={activitiesData?.totalCount ?? 0}
        currentPage={currentPage}
        pageSize={4}
        onPageChange={setCurrentPage}
        isLoading={activitiesLoading}
        uniqueKey={(item) => item.id}
        emptyState={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10"
          >
            <i className="ri-file-list-3-line text-4xl text-gray-300 mb-2"></i>
            <p className="text-gray-500">No activities found</p>
          </motion.div>
        }
      />
    </PageLayout>
  );
}
