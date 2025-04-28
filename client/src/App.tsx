import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import AttendancePage from "@/pages/attendance";
import SalesPage from "@/pages/sales";
import ReportsPage from "@/pages/reports";
import ProfilePage from "@/pages/profile";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useEffect } from "react";
import LoadingSpinner from "./components/layout/LoadingSpinner";

function ProtectedRouter() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated and not already on login page
    if (!isLoading && !isAuthenticated && location !== "/") {
      setLocation("/");
    }
    
    // Redirect to dashboard if authenticated and on login page
    if (!isLoading && isAuthenticated && location === "/") {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/attendance" component={AttendancePage} />
      <Route path="/sales" component={SalesPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider defaultLanguage="id">
          <TooltipProvider>
            <AuthProvider>
              <Toaster />
              <ProtectedRouter />
            </AuthProvider>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
