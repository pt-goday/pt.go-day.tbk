import { ReactNode } from "react";
import { motion } from "framer-motion";
import DataTablePagination from "./DataTablePagination";
import { exportToExcel } from "@/lib/utils";

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
  render?: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onExport?: () => void;
  exportFileName?: string;
  emptyState?: ReactNode;
  isLoading?: boolean;
  uniqueKey: (item: T) => string | number;
}

export default function DataTable<T>({
  title,
  columns,
  data,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onExport,
  exportFileName = "exported-data",
  emptyState,
  isLoading = false,
  uniqueKey
}: DataTableProps<T>) {
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      // Default export functionality using the exportToExcel utility
      exportToExcel(data, exportFileName);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-white rounded-lg shadow overflow-hidden"
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-primary">{title}</h3>
          <button 
            onClick={handleExport}
            className="flex items-center space-x-1 text-sm text-primary transition-all duration-300 hover:text-primary-dark"
          >
            <span>Export</span>
            <i className="ri-download-line"></i>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="w-10 h-10 border-4 border-primary border-opacity-30 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, index) => (
                  <th 
                    key={index}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ""}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length > 0 ? (
                data.map((item) => (
                  <tr 
                    key={uniqueKey(item)} 
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    {columns.map((column, colIndex) => {
                      const content = typeof column.accessor === "function" 
                        ? column.accessor(item)
                        : column.render 
                          ? column.render(item) 
                          : (item[column.accessor] as ReactNode);
                          
                      return (
                        <td 
                          key={colIndex}
                          className={`px-6 py-4 whitespace-nowrap ${column.className || ""}`}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-500">
                    {emptyState || "No data available"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <DataTablePagination
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </motion.div>
  );
}
