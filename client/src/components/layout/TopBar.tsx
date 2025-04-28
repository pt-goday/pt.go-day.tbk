import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { motion } from "framer-motion";
import { ThemeToggle } from "../ui/theme-toggle";
import { LanguageSwitcher } from "../ui/language-switcher";
import { Bell } from "lucide-react";

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-between items-center mb-8"
    >
      <h1 className="text-2xl font-bold text-primary">{t(`navigation.${title.toLowerCase()}`) || title}</h1>
      
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <LanguageSwitcher />
        
        <button className={`flex items-center space-x-1 text-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} py-1 px-3 rounded-md shadow-sm border`}>
          <Bell size={16} />
          <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
        </button>
        
        <div className="flex items-center space-x-2">
          <div className={`h-8 w-8 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-300 text-gray-700'} flex items-center justify-center overflow-hidden`}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="User Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-medium">{profile?.username?.charAt(0)?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-primary">{profile?.full_name || profile?.username}</p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} capitalize`}>{profile?.role}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
