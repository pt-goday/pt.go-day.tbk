import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { motion } from "framer-motion";
import Logo from "@/assets/logo.svg";
import { 
  LayoutDashboard, 
  UserCheck, 
  ShoppingCart, 
  FileText, 
  Target, 
  Settings,
  LogOut 
} from "lucide-react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
}

const SidebarItem = ({ icon, label, href, isActive }: SidebarItemProps) => {
  const { theme } = useTheme();
  const bgClass = isActive 
    ? theme === "dark" 
      ? "bg-gray-800" 
      : "bg-white bg-opacity-10" 
    : "";

  return (
    <li>
      <Link href={href}>
        <a className={`nav-link flex items-center space-x-3 px-3 py-2 rounded-md ${bgClass} hover:bg-white hover:bg-opacity-5 transition-all duration-300`}>
          {icon}
          <span>{label}</span>
        </a>
      </Link>
    </li>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  const { signOut, profile } = useAuth();
  const { theme } = useTheme();

  const menuItems = [
    {
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: <UserCheck size={18} />,
      label: "Attendance",
      href: "/attendance",
    },
    {
      icon: <ShoppingCart size={18} />,
      label: "Sales",
      href: "/sales",
    },
    {
      icon: <FileText size={18} />,
      label: "Work Reports",
      href: "/reports",
    },
    {
      icon: <Target size={18} />,
      label: "Targets",
      href: "/targets",
    },
    {
      icon: <Settings size={18} />,
      label: "Settings",
      href: "/settings",
    },
    {
      icon: <UserCheck size={18} />,
      label: "My Profile",
      href: "/profile",
    }
  ];

  // Only show certain menu items based on role
  const filteredMenuItems = profile?.role === "admin" 
    ? menuItems 
    : menuItems.filter(item => !["settings"].includes(item.href.substring(1)));

  const sidebarClass = theme === "dark" 
    ? "bg-gray-900 border-gray-800" 
    : "bg-primary border-gray-700";

  return (
    <motion.aside 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`fixed inset-y-0 left-0 ${sidebarClass} text-white w-64 overflow-y-auto transition-all duration-300 ease-in-out z-10 shadow-lg`}
    >
      <div className={`p-4 border-b ${theme === "dark" ? "border-gray-800" : "border-gray-700"}`}>
        <div className="flex items-center space-x-3">
          <img src={Logo} alt="Logo" className="h-10 w-10 rounded" />
          <div>
            <h1 className="font-bold text-lg">PT GO-DAY</h1>
            <p className="text-xs text-gray-400">Management System</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-1">
          {filteredMenuItems.map((item) => (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={location === item.href}
            />
          ))}
        </ul>
      </nav>
      
      <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${theme === "dark" ? "border-gray-800" : "border-gray-700"}`}>
        <button 
          onClick={() => signOut()}
          className="flex items-center space-x-3 nav-link px-3 py-2 rounded-md w-full hover:bg-white hover:bg-opacity-5 transition-all duration-300"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </motion.aside>
  );
}
