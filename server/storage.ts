import { 
  users, type User, type InsertUser,
  attendance, type Attendance, type InsertAttendance,
  sales, type Sale, type InsertSale,
  saleItems, type SaleItem, type InsertSaleItem,
  products, type Product, type InsertProduct,
  productCategories, type ProductCategory, type InsertProductCategory,
  workReports, type WorkReport, type InsertWorkReport
} from "@shared/schema";
import { supabase } from "./supabase";
import { nanoid } from "nanoid";
import { and, eq, desc, sql, lt, gt, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";

interface DbConnection {
  db: ReturnType<typeof drizzle>;
}

// Storage interface
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Attendance management
  getAttendanceById(id: number): Promise<Attendance | undefined>;
  getAttendanceByUserId(userId: number, page?: number, limit?: number): Promise<{ records: Attendance[], totalCount: number }>;
  getTodayAttendanceByUserId(userId: number): Promise<Attendance | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance>;
  
  // Sales management
  getSaleById(id: number): Promise<Sale | undefined>;
  getSalesByUserId(userId: number, page?: number, limit?: number): Promise<{ sales: Sale[], totalCount: number }>;
  getDailySalesByDate(date: Date): Promise<{ totalSales: number, transactions: number }>;
  createSale(sale: InsertSale): Promise<Sale>;
  createSaleItem(saleItem: InsertSaleItem): Promise<SaleItem>;
  getSaleItemsBySaleId(saleId: number): Promise<SaleItem[]>;
  
  // Product management
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getProductCategories(): Promise<ProductCategory[]>;
  
  // Work report management
  getWorkReportById(id: number): Promise<WorkReport | undefined>;
  getWorkReportsByUserId(userId: number, page?: number, limit?: number): Promise<{ reports: WorkReport[], totalCount: number }>;
  createWorkReport(report: InsertWorkReport): Promise<WorkReport>;
  updateWorkReport(id: number, data: Partial<InsertWorkReport>): Promise<WorkReport>;
}

export class SupabaseStorage implements IStorage {
  private connection: DbConnection;
  
  constructor() {
    this.connection = {
      db: drizzle(supabase)
    };
  }
  
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.connection.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.connection.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.connection.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const result = await this.connection.db.insert(users).values(user).returning();
    return result[0];
  }
  
  // Attendance management
  async getAttendanceById(id: number): Promise<Attendance | undefined> {
    const result = await this.connection.db.select().from(attendance).where(eq(attendance.id, id)).limit(1);
    return result[0];
  }
  
  async getAttendanceByUserId(userId: number, page: number = 1, limit: number = 10): Promise<{ records: Attendance[], totalCount: number }> {
    const offset = (page - 1) * limit;
    
    const records = await this.connection.db.select()
      .from(attendance)
      .where(eq(attendance.user_id, userId))
      .orderBy(desc(attendance.check_in))
      .limit(limit)
      .offset(offset);
    
    const countResult = await this.connection.db.select({ count: sql<number>`count(*)` })
      .from(attendance)
      .where(eq(attendance.user_id, userId));
    
    const totalCount = countResult[0]?.count || 0;
    
    return { records, totalCount };
  }
  
  async getTodayAttendanceByUserId(userId: number): Promise<Attendance | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const result = await this.connection.db.select()
      .from(attendance)
      .where(
        and(
          eq(attendance.user_id, userId),
          gte(attendance.check_in, today),
          lt(attendance.check_in, tomorrow)
        )
      )
      .limit(1);
    
    return result[0];
  }
  
  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const result = await this.connection.db.insert(attendance).values(attendanceData).returning();
    return result[0];
  }
  
  async updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance> {
    const result = await this.connection.db.update(attendance).set(data).where(eq(attendance.id, id)).returning();
    return result[0];
  }
  
  // Sales management
  async getSaleById(id: number): Promise<Sale | undefined> {
    const result = await this.connection.db.select().from(sales).where(eq(sales.id, id)).limit(1);
    return result[0];
  }
  
  async getSalesByUserId(userId: number, page: number = 1, limit: number = 10): Promise<{ sales: Sale[], totalCount: number }> {
    const offset = (page - 1) * limit;
    
    const salesResult = await this.connection.db.select()
      .from(sales)
      .where(eq(sales.user_id, userId))
      .orderBy(desc(sales.created_at))
      .limit(limit)
      .offset(offset);
    
    const countResult = await this.connection.db.select({ count: sql<number>`count(*)` })
      .from(sales)
      .where(eq(sales.user_id, userId));
    
    const totalCount = countResult[0]?.count || 0;
    
    return { sales: salesResult, totalCount };
  }
  
  async getDailySalesByDate(date: Date): Promise<{ totalSales: number, transactions: number }> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const salesResult = await this.connection.db.select()
      .from(sales)
      .where(
        and(
          gte(sales.sale_date, startDate),
          lte(sales.sale_date, endDate)
        )
      );
    
    const totalSales = salesResult.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
    const transactions = salesResult.length;
    
    return { totalSales, transactions };
  }
  
  async createSale(saleData: InsertSale): Promise<Sale> {
    // Generate invoice number if not provided
    if (!saleData.invoice_number) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      saleData.invoice_number = `INV-${dateStr}-${nanoid(6).toUpperCase()}`;
    }
    
    const result = await this.connection.db.insert(sales).values(saleData).returning();
    return result[0];
  }
  
  async createSaleItem(saleItem: InsertSaleItem): Promise<SaleItem> {
    const result = await this.connection.db.insert(saleItems).values(saleItem).returning();
    return result[0];
  }
  
  async getSaleItemsBySaleId(saleId: number): Promise<SaleItem[]> {
    return this.connection.db.select()
      .from(saleItems)
      .where(eq(saleItems.sale_id, saleId));
  }
  
  // Product management
  async getProductById(id: number): Promise<Product | undefined> {
    const result = await this.connection.db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }
  
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return this.connection.db.select()
      .from(products)
      .where(eq(products.category_id, categoryId));
  }
  
  async getProductCategories(): Promise<ProductCategory[]> {
    return this.connection.db.select().from(productCategories);
  }
  
  // Work report management
  async getWorkReportById(id: number): Promise<WorkReport | undefined> {
    const result = await this.connection.db.select().from(workReports).where(eq(workReports.id, id)).limit(1);
    return result[0];
  }
  
  async getWorkReportsByUserId(userId: number, page: number = 1, limit: number = 10): Promise<{ reports: WorkReport[], totalCount: number }> {
    const offset = (page - 1) * limit;
    
    const reports = await this.connection.db.select()
      .from(workReports)
      .where(eq(workReports.user_id, userId))
      .orderBy(desc(workReports.created_at))
      .limit(limit)
      .offset(offset);
    
    const countResult = await this.connection.db.select({ count: sql<number>`count(*)` })
      .from(workReports)
      .where(eq(workReports.user_id, userId));
    
    const totalCount = countResult[0]?.count || 0;
    
    return { reports, totalCount };
  }
  
  async createWorkReport(report: InsertWorkReport): Promise<WorkReport> {
    const result = await this.connection.db.insert(workReports).values(report).returning();
    return result[0];
  }
  
  async updateWorkReport(id: number, data: Partial<InsertWorkReport>): Promise<WorkReport> {
    const result = await this.connection.db.update(workReports).set(data).where(eq(workReports.id, id)).returning();
    return result[0];
  }
}

// Fallback to memory storage for development
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private attendance: Map<number, Attendance>;
  private sales: Map<number, Sale>;
  private saleItems: Map<number, SaleItem[]>;
  private products: Map<number, Product>;
  private productCategories: Map<number, ProductCategory>;
  private workReports: Map<number, WorkReport>;
  
  private userIdCounter: number = 1;
  private attendanceIdCounter: number = 1;
  private saleIdCounter: number = 1;
  private saleItemIdCounter: number = 1;
  private productIdCounter: number = 1;
  private categoryIdCounter: number = 1;
  private reportIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.attendance = new Map();
    this.sales = new Map();
    this.saleItems = new Map();
    this.products = new Map();
    this.productCategories = new Map();
    this.workReports = new Map();
    
    // Initialize with some sample data for development
    this.initializeSampleData();
  }
  
  private initializeSampleData() {
    // Add sample product categories
    const categories = [
      { id: 1, name: "Electronics", description: "Electronic devices and gadgets", created_at: new Date() },
      { id: 2, name: "Office Supplies", description: "Office supplies and stationery", created_at: new Date() },
      { id: 3, name: "Furniture", description: "Office furniture and fixtures", created_at: new Date() }
    ];
    
    categories.forEach(category => {
      this.productCategories.set(category.id, category as ProductCategory);
    });
    
    // Add sample products
    const productsList = [
      { id: 1, name: "Laptop", description: "High-performance work laptop", price: 15000000, category_id: 1, sku: "ELEC-001", created_at: new Date() },
      { id: 2, name: "Smartphone", description: "Business smartphone", price: 8000000, category_id: 1, sku: "ELEC-002", created_at: new Date() },
      { id: 3, name: "Tablet", description: "Professional tablet", price: 5000000, category_id: 1, sku: "ELEC-003", created_at: new Date() },
      { id: 4, name: "Paper Ream", description: "500 sheets A4 paper", price: 50000, category_id: 2, sku: "SUPP-001", created_at: new Date() },
      { id: 5, name: "Printer Ink", description: "Black printer ink cartridge", price: 250000, category_id: 2, sku: "SUPP-002", created_at: new Date() },
      { id: 6, name: "Stapler", description: "Heavy duty stapler", price: 15000, category_id: 2, sku: "SUPP-003", created_at: new Date() },
      { id: 7, name: "Office Chair", description: "Ergonomic office chair", price: 800000, category_id: 3, sku: "FURN-001", created_at: new Date() },
      { id: 8, name: "Desk", description: "Executive office desk", price: 1200000, category_id: 3, sku: "FURN-002", created_at: new Date() },
      { id: 9, name: "Filing Cabinet", description: "3-drawer filing cabinet", price: 600000, category_id: 3, sku: "FURN-003", created_at: new Date() }
    ];
    
    productsList.forEach(product => {
      this.products.set(product.id, product as Product);
    });
    
    // Set counters to next available id
    this.categoryIdCounter = categories.length + 1;
    this.productIdCounter = productsList.length + 1;
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, created_at: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  // Attendance management
  async getAttendanceById(id: number): Promise<Attendance | undefined> {
    return this.attendance.get(id);
  }
  
  async getAttendanceByUserId(userId: number, page: number = 1, limit: number = 10): Promise<{ records: Attendance[], totalCount: number }> {
    const records = Array.from(this.attendance.values())
      .filter(record => record.user_id === userId)
      .sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime());
    
    const totalCount = records.length;
    const startIndex = (page - 1) * limit;
    const paginatedRecords = records.slice(startIndex, startIndex + limit);
    
    return { records: paginatedRecords, totalCount };
  }
  
  async getTodayAttendanceByUserId(userId: number): Promise<Attendance | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return Array.from(this.attendance.values())
      .find(record => {
        const checkInDate = new Date(record.check_in);
        return record.user_id === userId && 
              checkInDate >= today && 
              checkInDate < tomorrow;
      });
  }
  
  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const id = this.attendanceIdCounter++;
    const record: Attendance = { ...attendanceData, id, created_at: new Date() };
    this.attendance.set(id, record);
    return record;
  }
  
  async updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance> {
    const record = this.attendance.get(id);
    if (!record) {
      throw new Error(`Attendance record with id ${id} not found`);
    }
    
    const updated = { ...record, ...data };
    this.attendance.set(id, updated);
    return updated;
  }
  
  // Sales management
  async getSaleById(id: number): Promise<Sale | undefined> {
    return this.sales.get(id);
  }
  
  async getSalesByUserId(userId: number, page: number = 1, limit: number = 10): Promise<{ sales: Sale[], totalCount: number }> {
    const salesList = Array.from(this.sales.values())
      .filter(sale => sale.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const totalCount = salesList.length;
    const startIndex = (page - 1) * limit;
    const paginatedSales = salesList.slice(startIndex, startIndex + limit);
    
    return { sales: paginatedSales, totalCount };
  }
  
  async getDailySalesByDate(date: Date): Promise<{ totalSales: number, transactions: number }> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const salesList = Array.from(this.sales.values())
      .filter(sale => {
        const saleDate = new Date(sale.sale_date);
        return saleDate >= startDate && saleDate <= endDate;
      });
    
    const totalSales = salesList.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
    const transactions = salesList.length;
    
    return { totalSales, transactions };
  }
  
  async createSale(saleData: InsertSale): Promise<Sale> {
    const id = this.saleIdCounter++;
    
    // Generate invoice number if not provided
    if (!saleData.invoice_number) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      saleData.invoice_number = `INV-${dateStr}-${nanoid(6).toUpperCase()}`;
    }
    
    const sale: Sale = { ...saleData, id, created_at: new Date() };
    this.sales.set(id, sale);
    return sale;
  }
  
  async createSaleItem(saleItem: InsertSaleItem): Promise<SaleItem> {
    const id = this.saleItemIdCounter++;
    const item: SaleItem = { ...saleItem, id, created_at: new Date() };
    
    // Store the item in the map of items by sale id
    const saleId = saleItem.sale_id;
    const existingItems = this.saleItems.get(saleId) || [];
    this.saleItems.set(saleId, [...existingItems, item]);
    
    return item;
  }
  
  async getSaleItemsBySaleId(saleId: number): Promise<SaleItem[]> {
    return this.saleItems.get(saleId) || [];
  }
  
  // Product management
  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.category_id === categoryId);
  }
  
  async getProductCategories(): Promise<ProductCategory[]> {
    return Array.from(this.productCategories.values());
  }
  
  // Work report management
  async getWorkReportById(id: number): Promise<WorkReport | undefined> {
    return this.workReports.get(id);
  }
  
  async getWorkReportsByUserId(userId: number, page: number = 1, limit: number = 10): Promise<{ reports: WorkReport[], totalCount: number }> {
    const reports = Array.from(this.workReports.values())
      .filter(report => report.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const totalCount = reports.length;
    const startIndex = (page - 1) * limit;
    const paginatedReports = reports.slice(startIndex, startIndex + limit);
    
    return { reports: paginatedReports, totalCount };
  }
  
  async createWorkReport(reportData: InsertWorkReport): Promise<WorkReport> {
    const id = this.reportIdCounter++;
    const report: WorkReport = { ...reportData, id, created_at: new Date() };
    this.workReports.set(id, report);
    return report;
  }
  
  async updateWorkReport(id: number, data: Partial<InsertWorkReport>): Promise<WorkReport> {
    const report = this.workReports.get(id);
    if (!report) {
      throw new Error(`Work report with id ${id} not found`);
    }
    
    const updated = { ...report, ...data };
    this.workReports.set(id, updated);
    return updated;
  }
}

// Use memory storage for now, can easily switch to Supabase storage later
export const storage = new MemStorage();
