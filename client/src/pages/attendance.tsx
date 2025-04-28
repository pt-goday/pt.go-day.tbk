import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/tables/DataTable";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatTime, calculateWorkingHours, getStatusColor } from "@/lib/utils";

// Sample data for demo purposes - in real app this would come from the API
const attendanceHistoryData = [
  {
    id: 1,
    date: "2024-01-10",
    checkIn: "2024-01-10T08:35:00",
    checkOut: null,
    workingHours: null,
    status: "In Progress"
  },
  {
    id: 2,
    date: "2024-01-09",
    checkIn: "2024-01-09T08:42:00",
    checkOut: "2024-01-09T17:38:00",
    workingHours: "8 hrs 56 mins",
    status: "Completed"
  },
  {
    id: 3,
    date: "2024-01-08",
    checkIn: "2024-01-08T08:30:00",
    checkOut: "2024-01-08T17:45:00",
    workingHours: "9 hrs 15 mins",
    status: "Completed"
  },
  {
    id: 4,
    date: "2024-01-05",
    checkIn: "2024-01-05T08:15:00",
    checkOut: "2024-01-05T16:30:00",
    workingHours: "8 hrs 15 mins",
    status: "Completed"
  }
];

const attendanceFormSchema = z.object({
  attendanceType: z.enum(["checkin", "checkout"], {
    required_error: "Please select attendance type",
  }),
  note: z.string().optional()
});

type AttendanceFormValues = z.infer<typeof attendanceFormSchema>;

export default function AttendancePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      attendanceType: "checkin",
      note: ""
    }
  });

  // In a real app, these would fetch from the backend
  const { data: locationData } = useQuery({
    queryKey: ['/api/attendance/location'],
    initialData: {
      location: "Office - Jakarta Headquarters"
    }
  });
  
  const { data: todayAttendance, isLoading: todayLoading } = useQuery({
    queryKey: ['/api/attendance/today'],
    initialData: {
      checkInTime: "08:35 AM",
      checkOutTime: null,
      workingHours: null,
      status: "In Progress"
    }
  });
  
  const { data: attendanceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/attendance/history', currentPage],
    initialData: {
      records: attendanceHistoryData,
      totalCount: 24
    }
  });

  const attendanceMutation = useMutation({
    mutationFn: async (data: AttendanceFormValues) => {
      return apiRequest('POST', '/api/attendance', data);
    },
    onSuccess: () => {
      const action = form.getValues("attendanceType") === "checkin" ? "Check-in" : "Check-out";
      toast({
        title: `${action} Successful`,
        description: `Your ${action.toLowerCase()} has been recorded successfully`,
      });
      form.reset({ attendanceType: "checkin", note: "" });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/history'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to record attendance: ${error.message}`,
      });
    }
  });

  const onSubmit = (data: AttendanceFormValues) => {
    attendanceMutation.mutate(data);
  };

  const resetForm = () => {
    form.reset({ attendanceType: "checkin", note: "" });
  };

  const attendanceColumns = [
    {
      header: "Date",
      accessor: (item: typeof attendanceHistoryData[0]) => formatDate(item.date),
      className: "text-sm text-primary",
    },
    {
      header: "Check In",
      accessor: (item: typeof attendanceHistoryData[0]) => 
        item.checkIn ? formatTime(item.checkIn) : "-- : --",
      className: "text-sm text-gray-500",
    },
    {
      header: "Check Out",
      accessor: (item: typeof attendanceHistoryData[0]) => 
        item.checkOut ? formatTime(item.checkOut) : "-- : --",
      className: "text-sm text-gray-500",
    },
    {
      header: "Working Hours",
      accessor: (item: typeof attendanceHistoryData[0]) => 
        item.workingHours || "-- hrs -- mins",
      className: "text-sm text-gray-500",
    },
    {
      header: "Status",
      accessor: (item: typeof attendanceHistoryData[0]) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
          {item.status}
        </span>
      ),
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
    <PageLayout title="Attendance System">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Attendance Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold mb-4 text-primary">Attendance Form</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="attendanceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-primary mb-1">Attendance Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                          <SelectValue placeholder="Select attendance type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="checkin">Check In</SelectItem>
                        <SelectItem value="checkout">Check Out</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-primary mb-1">Note (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add any notes about your attendance"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="mb-6">
                <FormLabel className="block text-sm font-medium text-primary mb-1">Current Location</FormLabel>
                <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                  <div className="flex items-center text-sm text-gray-500">
                    <i className="ri-map-pin-line mr-2"></i>
                    <span>{locationData?.location}</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">Your current location will be recorded with your attendance</p>
              </div>
              
              <div className="flex justify-between">
                <Button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300"
                  variant="outline"
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={attendanceMutation.isPending}
                  className="bg-primary text-white font-medium py-2 px-4 rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300"
                >
                  {attendanceMutation.isPending ? "Submitting..." : "Submit Attendance"}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
        
        {/* Attendance Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg shadow overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-primary">Today's Attendance</h2>
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Check In Time</p>
                <p className="text-xl font-bold text-primary">{todayAttendance?.checkInTime || "-- : --"}</p>
              </div>
              <div className="h-10 border-r border-gray-200"></div>
              <div>
                <p className="text-sm font-medium text-gray-500">Check Out Time</p>
                <p className="text-xl font-bold text-primary">{todayAttendance?.checkOutTime || "-- : --"}</p>
              </div>
              <div className="h-10 border-r border-gray-200"></div>
              <div>
                <p className="text-sm font-medium text-gray-500">Working Hours</p>
                <p className="text-xl font-bold text-primary">{todayAttendance?.workingHours || "-- hrs -- mins"}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {todayAttendance?.checkInTime && (
                <div className="flex items-center space-x-2 text-sm">
                  <i className="ri-checkbox-circle-line text-success"></i>
                  <span className="text-gray-500">You've checked in successfully today</span>
                </div>
              )}
              
              {!todayAttendance?.checkOutTime && todayAttendance?.checkInTime && (
                <div className="flex items-center space-x-2 text-sm">
                  <i className="ri-time-line text-warning"></i>
                  <span className="text-gray-500">Don't forget to check out before you leave</span>
                </div>
              )}
              
              {!todayAttendance?.checkInTime && (
                <div className="flex items-center space-x-2 text-sm">
                  <i className="ri-information-line text-info"></i>
                  <span className="text-gray-500">You haven't checked in today</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Attendance History Table */}
      <DataTable
        title="Attendance History"
        columns={attendanceColumns}
        data={attendanceHistory?.records ?? []}
        totalItems={attendanceHistory?.totalCount ?? 0}
        currentPage={currentPage}
        pageSize={4}
        onPageChange={setCurrentPage}
        isLoading={historyLoading}
        uniqueKey={(item) => item.id}
        exportFileName="attendance-history"
      />
    </PageLayout>
  );
}
