import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";

// Sample data for demo purposes
const productCategories = [
  { id: "category1", name: "Electronics" },
  { id: "category2", name: "Office Supplies" },
  { id: "category3", name: "Furniture" }
];

const products = {
  category1: [
    { id: "product1", name: "Laptop", price: 15000000 },
    { id: "product2", name: "Smartphone", price: 8000000 },
    { id: "product3", name: "Tablet", price: 5000000 }
  ],
  category2: [
    { id: "product4", name: "Paper Ream", price: 50000 },
    { id: "product5", name: "Printer Ink", price: 250000 },
    { id: "product6", name: "Stapler", price: 15000 }
  ],
  category3: [
    { id: "product7", name: "Office Chair", price: 800000 },
    { id: "product8", name: "Desk", price: 1200000 },
    { id: "product9", name: "Filing Cabinet", price: 600000 }
  ]
};

const salesPersons = [
  { id: "person1", name: "Sarah Johnson" },
  { id: "person2", name: "Alex Chen" },
  { id: "person3", name: "Michael Torres" },
  { id: "person4", name: "Aisha Williams" }
];

const paymentMethods = [
  { id: "cash", name: "Cash" },
  { id: "transfer", name: "Bank Transfer" },
  { id: "ewallet", name: "E-Wallet" },
  { id: "card", name: "Credit/Debit Card" }
];

const recentSalesData = [
  {
    id: 1,
    invoiceNumber: "INV-001234",
    date: "2024-01-10",
    customer: "Acme Corporation",
    salesPerson: "Sarah Johnson",
    amount: 4250000,
    status: "Completed"
  },
  {
    id: 2,
    invoiceNumber: "INV-001233",
    date: "2024-01-10",
    customer: "Beta Enterprises",
    salesPerson: "Michael Torres",
    amount: 3750000,
    status: "Completed"
  },
  {
    id: 3,
    invoiceNumber: "INV-001232",
    date: "2024-01-10",
    customer: "Gamma Industries",
    salesPerson: "Alex Chen",
    amount: 2100000,
    status: "Pending"
  },
  {
    id: 4,
    invoiceNumber: "INV-001231",
    date: "2024-01-09",
    customer: "Delta Corp",
    salesPerson: "Aisha Williams",
    amount: 5875000,
    status: "Completed"
  }
];

// Form validation schema
const productItemSchema = z.object({
  productId: z.string().min(1, "Please select a product"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  price: z.coerce.number().min(0, "Price cannot be negative")
});

const salesFormSchema = z.object({
  saleDate: z.string().min(1, "Date is required"),
  customerName: z.string().min(1, "Customer name is required"),
  productCategory: z.string().min(1, "Product category is required"),
  productItems: z.array(productItemSchema).min(1, "At least one product must be added"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  salesPerson: z.string().min(1, "Sales person is required"),
  notes: z.string().optional()
});

type SalesFormValues = z.infer<typeof salesFormSchema>;

export default function SalesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      saleDate: new Date().toISOString().split('T')[0],
      customerName: "",
      productCategory: "",
      productItems: [{ productId: "", quantity: 1, price: 0 }],
      paymentMethod: "",
      salesPerson: "",
      notes: ""
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "productItems"
  });

  const watchProductCategory = form.watch("productCategory");
  const watchProductItems = form.watch("productItems");
  
  // Update the selected category when it changes in the form
  if (watchProductCategory !== selectedCategory) {
    setSelectedCategory(watchProductCategory);
  }
  
  // Calculate totals for the summary
  const calculateSummary = () => {
    if (!watchProductItems?.length) return { subtotal: 0, tax: 0, discount: 0, total: 0 };
    
    const subtotal = watchProductItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.11; // 11% tax
    const discount = 0; // no discount in this example
    const total = subtotal + tax - discount;
    
    return {
      subtotal,
      tax,
      discount,
      total
    };
  };
  
  const summary = calculateSummary();

  // In a real app, these would fetch from the backend
  const { data: dailySalesStats } = useQuery({
    queryKey: ['/api/sales/daily-stats'],
    initialData: {
      totalSales: 12500000,
      transactions: 8,
      averageSale: 1562500,
      targetAmount: 20000000,
      progress: 62.5
    }
  });
  
  const { data: recentSales, isLoading: salesLoading } = useQuery({
    queryKey: ['/api/sales/recent', currentPage],
    initialData: {
      sales: recentSalesData,
      totalCount: 18
    }
  });

  const salesMutation = useMutation({
    mutationFn: async (data: SalesFormValues) => {
      return apiRequest('POST', '/api/sales', data);
    },
    onSuccess: () => {
      toast({
        title: "Sale Entry Successful",
        description: "The sale has been recorded successfully",
      });
      
      // Reset the form
      form.reset({
        saleDate: new Date().toISOString().split('T')[0],
        customerName: "",
        productCategory: "",
        productItems: [{ productId: "", quantity: 1, price: 0 }],
        paymentMethod: "",
        salesPerson: "",
        notes: ""
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/sales/daily-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales/recent'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to record sale: ${error.message}`,
      });
    }
  });

  const onSubmit = (data: SalesFormValues) => {
    salesMutation.mutate(data);
  };

  const resetForm = () => {
    form.reset({
      saleDate: new Date().toISOString().split('T')[0],
      customerName: "",
      productCategory: "",
      productItems: [{ productId: "", quantity: 1, price: 0 }],
      paymentMethod: "",
      salesPerson: "",
      notes: ""
    });
  };
  
  const handleProductChange = (index: number, productId: string) => {
    const category = form.getValues("productCategory");
    if (!category || !productId) return;
    
    const selectedProduct = products[category as keyof typeof products].find(p => p.id === productId);
    if (selectedProduct) {
      form.setValue(`productItems.${index}.price`, selectedProduct.price);
    }
  };
  
  const addProductItem = () => {
    append({ productId: "", quantity: 1, price: 0 });
  };

  const salesColumns = [
    {
      header: "Invoice",
      accessor: "invoiceNumber",
      className: "text-sm text-primary",
    },
    {
      header: "Date",
      accessor: (item: typeof recentSalesData[0]) => formatDate(item.date),
      className: "text-sm text-gray-500",
    },
    {
      header: "Customer",
      accessor: "customer",
      className: "text-sm text-gray-500",
    },
    {
      header: "Sales Person",
      accessor: "salesPerson",
      className: "text-sm text-gray-500",
    },
    {
      header: "Amount",
      accessor: (item: typeof recentSalesData[0]) => (
        <span className="text-sm font-medium text-primary">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      header: "Status",
      accessor: (item: typeof recentSalesData[0]) => (
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
    <PageLayout title="Daily Sales Form">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales Entry Form */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold mb-4 text-primary">New Sales Entry</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="saleDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-sm font-medium text-primary mb-1">Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-sm font-medium text-primary mb-1">Customer Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter customer name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="productCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-primary mb-1">Product Category</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("productItems", [{ productId: "", quantity: 1, price: 0 }]);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Dynamic Product List */}
                <div className="mb-4 border border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5 text-xs font-medium text-gray-500">Product</div>
                      <div className="col-span-2 text-xs font-medium text-gray-500">Quantity</div>
                      <div className="col-span-3 text-xs font-medium text-gray-500">Price</div>
                      <div className="col-span-2 text-xs font-medium text-gray-500">Action</div>
                    </div>
                  </div>
                  
                  {fields.map((field, index) => (
                    <div key={field.id} className="px-4 py-2 border-b border-gray-200">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <Controller
                            control={form.control}
                            name={`productItems.${index}.productId`}
                            render={({ field }) => (
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleProductChange(index, value);
                                }}
                                value={field.value}
                                disabled={!selectedCategory}
                              >
                                <SelectTrigger className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent">
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedCategory && products[selectedCategory as keyof typeof products].map((product) => (
                                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="1"
                            {...form.register(`productItems.${index}.quantity`, { valueAsNumber: true })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            step="0.01"
                            {...form.register(`productItems.${index}.price`, { valueAsNumber: true })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                        <div className="col-span-2 flex space-x-1">
                          <button
                            type="button"
                            onClick={() => fields.length > 1 && remove(index)}
                            className="p-1 rounded-md text-red-500 hover:bg-red-50"
                            disabled={fields.length <= 1}
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </div>
                      <FormMessage>
                        {form.formState.errors.productItems?.[index]?.productId?.message || 
                         form.formState.errors.productItems?.[index]?.quantity?.message || 
                         form.formState.errors.productItems?.[index]?.price?.message}
                      </FormMessage>
                    </div>
                  ))}
                  
                  <div className="p-4">
                    <button
                      type="button"
                      onClick={addProductItem}
                      className="flex items-center text-sm text-primary"
                      disabled={!selectedCategory}
                    >
                      <i className="ri-add-line mr-1"></i>
                      <span>Add Product</span>
                    </button>
                  </div>
                </div>
                <FormMessage>{form.formState.errors.productItems?.message}</FormMessage>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-sm font-medium text-primary mb-1">Payment Method</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paymentMethods.map((method) => (
                              <SelectItem key={method.id} value={method.id}>{method.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="salesPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-sm font-medium text-primary mb-1">Sales Person</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                              <SelectValue placeholder="Select sales person" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {salesPersons.map((person) => (
                              <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-primary mb-1">Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Add any notes about this sale"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={3}
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
                    disabled={salesMutation.isPending}
                    className="bg-primary text-white font-medium py-2 px-4 rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300"
                  >
                    {salesMutation.isPending ? "Submitting..." : "Submit Sale"}
                  </Button>
                </div>
              </form>
            </Form>
          </motion.div>
        </div>
        
        {/* Sales Summary */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold mb-4 text-primary">Sale Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-sm font-medium text-primary">{formatCurrency(summary.subtotal)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Tax (11%)</span>
                <span className="text-sm font-medium text-primary">{formatCurrency(summary.tax)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Discount</span>
                <span className="text-sm font-medium text-primary">{formatCurrency(summary.discount)}</span>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-primary">Total</span>
                  <span className="text-base font-bold text-primary">{formatCurrency(summary.total)}</span>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h2 className="text-lg font-semibold mb-4 text-primary">Daily Sales Stats</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Sales Today</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(dailySalesStats?.totalSales ?? 0)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Number of Transactions</p>
                <p className="text-xl font-bold text-primary">{dailySalesStats?.transactions}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Average Sale Value</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(dailySalesStats?.averageSale ?? 0)}</p>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Daily Target Progress</p>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-primary">{dailySalesStats?.progress}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-primary">
                        {formatCurrency(dailySalesStats?.totalSales ?? 0)} / {formatCurrency(dailySalesStats?.targetAmount ?? 0)}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                    <div 
                      style={{ width: `${dailySalesStats?.progress}%` }} 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Recent Sales Table */}
      <DataTable
        title="Recent Sales"
        columns={salesColumns}
        data={recentSales?.sales ?? []}
        totalItems={recentSales?.totalCount ?? 0}
        currentPage={currentPage}
        pageSize={4}
        onPageChange={setCurrentPage}
        isLoading={salesLoading}
        uniqueKey={(item) => item.id}
        exportFileName="recent-sales"
      />
    </PageLayout>
  );
}
