import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layout/PageLayout";
import DataTable from "@/components/tables/DataTable";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, getStatusColor } from "@/lib/utils";

// Sample data for demo purposes
const reportTypes = [
  { id: "daily", name: "Daily Report" },
  { id: "weekly", name: "Weekly Report" },
  { id: "monthly", name: "Monthly Report" },
  { id: "project", name: "Project Report" }
];

const departments = [
  { id: "sales", name: "Sales" },
  { id: "marketing", name: "Marketing" },
  { id: "operations", name: "Operations" },
  { id: "finance", name: "Finance" },
  { id: "hr", name: "Human Resources" }
];

const workReportsData = [
  {
    id: 1,
    title: "Weekly Sales Performance",
    reportType: "weekly",
    department: "Sales",
    createdBy: "Sarah Johnson",
    createdAt: "2024-01-10T14:30:00",
    status: "Completed"
  },
  {
    id: 2,
    title: "Q1 Marketing Campaign Results",
    reportType: "monthly",
    department: "Marketing",
    createdBy: "Alex Chen",
    createdAt: "2024-01-09T11:15:00",
    status: "In Progress"
  },
  {
    id: 3,
    title: "Inventory Management Analysis",
    reportType: "daily",
    department: "Operations",
    createdBy: "Michael Torres",
    createdAt: "2024-01-08T10:20:00",
    status: "Review Needed"
  },
  {
    id: 4,
    title: "Customer Acquisition Report",
    reportType: "monthly",
    department: "Sales",
    createdBy: "Aisha Williams",
    createdAt: "2024-01-07T16:45:00",
    status: "Completed"
  }
];

// Form validation schema
const workReportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  reportType: z.string().min(1, "Report type is required"),
  department: z.string().min(1, "Department is required"),
  tasks: z.string().min(10, "Tasks description must be at least 10 characters"),
  outcomes: z.string().min(10, "Outcomes must be at least 10 characters"),
  challenges: z.string().optional(),
  nextSteps: z.string().optional()
});

type WorkReportFormValues = z.infer<typeof workReportSchema>;

export default function ReportsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<WorkReportFormValues>({
    resolver: zodResolver(workReportSchema),
    defaultValues: {
      title: "",
      reportType: "",
      department: "",
      tasks: "",
      outcomes: "",
      challenges: "",
      nextSteps: ""
    }
  });

  // In a real app, this would fetch from the backend
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/reports', currentPage],
    initialData: {
      reports: workReportsData,
      totalCount: 15
    }
  });

  const reportMutation = useMutation({
    mutationFn: async (data: WorkReportFormValues) => {
      return apiRequest('POST', '/api/reports', data);
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Your work report has been submitted successfully",
      });
      
      // Reset the form
      form.reset({
        title: "",
        reportType: "",
        department: "",
        tasks: "",
        outcomes: "",
        challenges: "",
        nextSteps: ""
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to submit report: ${error.message}`,
      });
    }
  });

  const onSubmit = (data: WorkReportFormValues) => {
    reportMutation.mutate(data);
  };

  const resetForm = () => {
    form.reset({
      title: "",
      reportType: "",
      department: "",
      tasks: "",
      outcomes: "",
      challenges: "",
      nextSteps: ""
    });
  };

  const reportsColumns = [
    {
      header: "Title",
      accessor: "title",
      className: "text-sm text-primary font-medium",
    },
    {
      header: "Report Type",
      accessor: "reportType",
      className: "text-sm text-gray-500 capitalize",
      render: (item: typeof workReportsData[0]) => {
        const reportType = reportTypes.find(r => r.id === item.reportType);
        return reportType?.name || item.reportType;
      }
    },
    {
      header: "Department",
      accessor: "department",
      className: "text-sm text-gray-500",
    },
    {
      header: "Created By",
      accessor: "createdBy",
      className: "text-sm text-gray-500",
    },
    {
      header: "Date",
      accessor: (item: typeof workReportsData[0]) => formatDate(item.createdAt),
      className: "text-sm text-gray-500",
    },
    {
      header: "Status",
      accessor: (item: typeof workReportsData[0]) => (
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
    <PageLayout title="Work Reports">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Work Report Form */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold mb-4 text-primary">Submit Work Report</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-primary mb-1">Report Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter report title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reportType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-sm font-medium text-primary mb-1">Report Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                              <SelectValue placeholder="Select report type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {reportTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-sm font-medium text-primary mb-1">Department</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="tasks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-primary mb-1">Tasks Completed</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe tasks completed during this period"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="outcomes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-primary mb-1">Outcomes & Achievements</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe outcomes and achievements"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="challenges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-primary mb-1">Challenges (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe any challenges faced"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nextSteps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-primary mb-1">Next Steps (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe planned next steps"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                    disabled={reportMutation.isPending}
                    className="bg-primary text-white font-medium py-2 px-4 rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300"
                  >
                    {reportMutation.isPending ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </form>
            </Form>
          </motion.div>
        </div>
        
        {/* Report Guidelines */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold mb-4 text-primary">Report Guidelines</h2>
            
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium text-primary mb-1">Daily Reports</h3>
                <p className="text-gray-500">Focus on specific tasks completed during the day and immediate outcomes. Keep it concise and relevant.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-primary mb-1">Weekly Reports</h3>
                <p className="text-gray-500">Summarize key achievements, challenges, and progress toward goals. Include metrics where possible.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-primary mb-1">Monthly Reports</h3>
                <p className="text-gray-500">Provide comprehensive overview of the month's activities, major milestones, and progress against quarterly objectives.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-primary mb-1">Project Reports</h3>
                <p className="text-gray-500">Detail specific project progress, timeline updates, resource utilization, and any scope changes.</p>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-medium text-primary mb-1">Tips for Effective Reporting</h3>
                <ul className="list-disc pl-5 text-gray-500 space-y-1">
                  <li>Be specific and provide concrete examples</li>
                  <li>Include quantifiable metrics when possible</li>
                  <li>Focus on outcomes rather than activities</li>
                  <li>Highlight both successes and areas for improvement</li>
                  <li>Keep language clear and concise</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Work Reports Table */}
      <DataTable
        title="Work Reports"
        columns={reportsColumns}
        data={reportsData?.reports ?? []}
        totalItems={reportsData?.totalCount ?? 0}
        currentPage={currentPage}
        pageSize={4}
        onPageChange={setCurrentPage}
        isLoading={reportsLoading}
        uniqueKey={(item) => item.id}
        exportFileName="work-reports"
      />
    </PageLayout>
  );
}
