import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabase } from "./supabase";
import { 
  insertAttendanceSchema, 
  insertSaleSchema, 
  insertSaleItemSchema, 
  insertWorkReportSchema,
  insertUserSchema
} from "@shared/schema";
import { 
  AttendanceFormData, 
  SalesFormData, 
  WorkReportFormData,
  UserProfile
} from "@shared/types";
import { formatDate, formatTime, calculateWorkingHours } from "../client/src/lib/utils";
import { nanoid } from "nanoid";

// Helper function to validate request session
async function validateSession(req: Request): Promise<UserProfile | null> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  // Verify token with Supabase
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) {
    return null;
  }
  
  // Get user profile from database
  const user = await storage.getUserByEmail(data.user.email || '');
  
  if (!user) {
    return null;
  }
  
  return {
    id: user.id.toString(),
    username: user.username,
    role: user.role as "admin" | "karyawan",
    avatar_url: user.avatar_url,
    full_name: user.full_name,
    email: user.email
  };
}

// Helper function for protected routes
function protectedRoute(handler: (req: Request, res: Response, user: UserProfile) => Promise<void>) {
  return async (req: Request, res: Response) => {
    try {
      const user = await validateSession(req);
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized access" });
      }
      
      await handler(req, res, user);
    } catch (error: any) {
      console.error("Error in protected route:", error);
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Supabase client initialization endpoint
  app.get('/api/supabase-config', (req, res) => {
    res.json({
      url: process.env.VITE_SUPABASE_URL,
      anon_key: process.env.VITE_SUPABASE_ANON_KEY
    });
  });
  
  // User management endpoints
  app.post('/api/users', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Dashboard endpoints
  app.get('/api/dashboard/stats', protectedRoute(async (req, res, user) => {
    // In a real app, these would be calculated from actual data
    const today = new Date();
    
    // Get daily sales
    const { totalSales } = await storage.getDailySalesByDate(today);
    
    // Format statistics according to frontend expectations
    const stats = {
      totalSales: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(totalSales || 45750000),
      attendance: "97.8%",
      target: "85.2%",
      workCompleted: "42/50"
    };
    
    res.json(stats);
  }));
  
  app.get('/api/dashboard/activities', protectedRoute(async (req, res, user) => {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '4');
    
    // Mock activities data
    const activities = [
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
      }
    ];
    
    // In a real app, we would fetch these from database with proper pagination
    const startIndex = (page - 1) * limit;
    const paginatedActivities = activities.slice(startIndex, startIndex + limit);
    
    res.json({
      activities: paginatedActivities,
      totalCount: activities.length
    });
  }));
  
  // Attendance endpoints
  app.get('/api/attendance/location', protectedRoute(async (req, res, user) => {
    // In a real app, this might come from GPS or IP geolocation
    res.json({ location: "Office - Jakarta Headquarters" });
  }));
  
  app.get('/api/attendance/today', protectedRoute(async (req, res, user) => {
    try {
      const userId = parseInt(user.id);
      const record = await storage.getTodayAttendanceByUserId(userId);
      
      if (!record) {
        return res.json({
          checkInTime: null,
          checkOutTime: null,
          workingHours: null,
          status: "Not Started"
        });
      }
      
      const checkInTime = record.check_in ? formatTime(record.check_in) : null;
      const checkOutTime = record.check_out ? formatTime(record.check_out) : null;
      const workingHours = (record.check_in && record.check_out) 
        ? calculateWorkingHours(record.check_in, record.check_out) 
        : null;
      const status = record.check_out ? "Completed" : "In Progress";
      
      res.json({
        checkInTime,
        checkOutTime,
        workingHours,
        status
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }));
  
  app.get('/api/attendance/history', protectedRoute(async (req, res, user) => {
    try {
      const userId = parseInt(user.id);
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '4');
      
      const { records, totalCount } = await storage.getAttendanceByUserId(userId, page, limit);
      
      // Transform records to expected format
      const formattedRecords = records.map(record => {
        return {
          id: record.id,
          date: formatDate(record.check_in),
          checkIn: record.check_in,
          checkOut: record.check_out,
          workingHours: (record.check_in && record.check_out) 
            ? calculateWorkingHours(record.check_in, record.check_out) 
            : null,
          status: record.check_out ? "Completed" : "In Progress"
        };
      });
      
      res.json({
        records: formattedRecords,
        totalCount
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }));
  
  app.post('/api/attendance', protectedRoute(async (req, res, user) => {
    try {
      const { attendanceType, note } = req.body as AttendanceFormData;
      const userId = parseInt(user.id);
      
      if (attendanceType === "checkin") {
        // Check if already checked in today
        const existingRecord = await storage.getTodayAttendanceByUserId(userId);
        
        if (existingRecord) {
          return res.status(400).json({ message: "Already checked in today" });
        }
        
        // Create new attendance record
        const attendanceData = insertAttendanceSchema.parse({
          user_id: userId,
          check_in: new Date(),
          location: "Office - Jakarta Headquarters",
          note: note || null
        });
        
        const record = await storage.createAttendance(attendanceData);
        
        res.status(201).json({
          id: record.id,
          checkInTime: formatTime(record.check_in),
          message: "Check-in successful"
        });
      } else if (attendanceType === "checkout") {
        // Get today's attendance record
        const existingRecord = await storage.getTodayAttendanceByUserId(userId);
        
        if (!existingRecord) {
          return res.status(400).json({ message: "No check-in record found for today" });
        }
        
        if (existingRecord.check_out) {
          return res.status(400).json({ message: "Already checked out today" });
        }
        
        // Update the record with check-out time
        const updated = await storage.updateAttendance(existingRecord.id, {
          check_out: new Date(),
          note: note ? (existingRecord.note ? `${existingRecord.note}; ${note}` : note) : existingRecord.note
        });
        
        res.json({
          id: updated.id,
          checkOutTime: formatTime(updated.check_out!),
          workingHours: calculateWorkingHours(updated.check_in, updated.check_out!),
          message: "Check-out successful"
        });
      } else {
        res.status(400).json({ message: "Invalid attendance type" });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }));
  
  // Sales endpoints
  app.get('/api/sales/daily-stats', protectedRoute(async (req, res, user) => {
    try {
      const today = new Date();
      const { totalSales, transactions } = await storage.getDailySalesByDate(today);
      
      // Calculate average sale
      const averageSale = transactions > 0 ? totalSales / transactions : 0;
      
      // In a real app, target would come from a settings table
      const targetAmount = 20000000;
      const progress = Math.min(100, Math.round((totalSales / targetAmount) * 100 * 10) / 10);
      
      res.json({
        totalSales,
        transactions,
        averageSale,
        targetAmount,
        progress
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }));
  
  app.get('/api/sales/recent', protectedRoute(async (req, res, user) => {
    try {
      const userId = parseInt(user.id);
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '4');
      
      const { sales, totalCount } = await storage.getSalesByUserId(userId, page, limit);
      
      // Transform sales to expected format
      const formattedSales = sales.map(sale => {
        return {
          id: sale.id,
          invoiceNumber: sale.invoice_number,
          date: formatDate(sale.sale_date),
          customer: sale.customer_name,
          salesPerson: user.full_name || user.username,
          amount: Number(sale.total_amount),
          status: sale.status
        };
      });
      
      res.json({
        sales: formattedSales,
        totalCount
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }));
  
  app.post('/api/sales', protectedRoute(async (req, res, user) => {
    try {
      const { 
        saleDate, 
        customerName, 
        productItems, 
        paymentMethod, 
        notes 
      } = req.body as SalesFormData;
      
      const userId = parseInt(user.id);
      
      // Calculate totals
      const subtotal = productItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxAmount = subtotal * 0.11; // 11% tax
      const discountAmount = 0; // no discount in this example
      const totalAmount = subtotal + taxAmount - discountAmount;
      
      // Create sale record
      const saleData = insertSaleSchema.parse({
        user_id: userId,
        invoice_number: `INV-${saleDate.replace(/-/g, '')}-${nanoid(6).toUpperCase()}`,
        customer_name: customerName,
        sale_date: new Date(saleDate),
        total_amount: totalAmount,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        payment_method: paymentMethod,
        notes: notes || null,
        status: "completed"
      });
      
      const sale = await storage.createSale(saleData);
      
      // Create sale items
      const saleItemPromises = productItems.map(item => {
        const saleItemData = insertSaleItemSchema.parse({
          sale_id: sale.id,
          product_id: parseInt(item.productId),
          quantity: item.quantity,
          unit_price: item.price
        });
        
        return storage.createSaleItem(saleItemData);
      });
      
      await Promise.all(saleItemPromises);
      
      res.status(201).json({
        id: sale.id,
        invoiceNumber: sale.invoice_number,
        totalAmount: totalAmount,
        message: "Sale recorded successfully"
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }));
  
  // Work Report endpoints
  app.get('/api/reports', protectedRoute(async (req, res, user) => {
    try {
      const userId = parseInt(user.id);
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '4');
      
      const { reports, totalCount } = await storage.getWorkReportsByUserId(userId, page, limit);
      
      // Transform reports to expected format
      const formattedReports = reports.map(report => {
        return {
          id: report.id,
          title: report.title,
          reportType: report.report_type,
          department: report.department,
          createdBy: user.full_name || user.username,
          createdAt: report.created_at.toISOString(),
          status: report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
        };
      });
      
      res.json({
        reports: formattedReports,
        totalCount
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }));
  
  app.post('/api/reports', protectedRoute(async (req, res, user) => {
    try {
      const { 
        title, 
        reportType, 
        department, 
        tasks, 
        outcomes, 
        challenges, 
        nextSteps 
      } = req.body as WorkReportFormData;
      
      const userId = parseInt(user.id);
      
      // Create work report
      const reportData = insertWorkReportSchema.parse({
        user_id: userId,
        title,
        report_type: reportType,
        department,
        tasks,
        outcomes,
        challenges: challenges || null,
        next_steps: nextSteps || null,
        status: "submitted"
      });
      
      const report = await storage.createWorkReport(reportData);
      
      res.status(201).json({
        id: report.id,
        title: report.title,
        status: report.status,
        message: "Work report submitted successfully"
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }));

  return httpServer;
}
