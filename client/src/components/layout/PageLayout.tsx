import { ReactNode } from "react";
import { motion } from "framer-motion";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import { useTheme } from "../../contexts/ThemeContext";

interface PageLayoutProps {
  children: ReactNode;
  title: string;
}

export default function PageLayout({ children, title }: PageLayoutProps) {
  const { theme } = useTheme();
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className={`flex-1 ml-64 p-6 ${theme === "dark" ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
        <TopBar title={title} />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}