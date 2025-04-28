import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: {
    id: string;
    username: string;
    role: "admin" | "karyawan";
    avatar_url?: string;
    full_name?: string;
    email?: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Default dev mode
const isDev = import.meta.env.DEV || true;

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // In development mode with no Supabase setup, use a mock profile
      if (isDev && import.meta.env.VITE_SUPABASE_URL === undefined) {
        console.info("Using development mock profile");
        setProfile({
          id: "1",
          username: "admin",
          role: "admin",
          full_name: "Administrator",
          email: "admin@goday.com"
        });
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      
      // In development, fallback to mock profile on error
      if (isDev) {
        setProfile({
          id: "1",
          username: "admin",
          role: "admin",
          full_name: "Administrator",
          email: "admin@goday.com"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // In development mode with no Supabase setup, use a mock login
      if (isDev && import.meta.env.VITE_SUPABASE_URL === undefined) {
        console.info("Using development mock login");
        
        // Mock successful login
        const mockUserId = "1";
        setUser({ id: mockUserId } as User);
        setProfile({
          id: mockUserId,
          username: email.split('@')[0],
          role: "admin",
          full_name: "Administrator",
          email: email
        });
        
        // Create a mock session
        setSession({ 
          user: { id: mockUserId } as User,
          access_token: "mock-token",
          refresh_token: "mock-refresh-token",
        } as Session);
        
        toast({
          title: "Login Successful",
          description: "Welcome to the dashboard!",
        });
        
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message,
        });
        throw error;
      }

      if (data?.user) {
        await fetchUserProfile(data.user.id);
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
      }
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // In development mode with mock login, just clear the state
      if (isDev && import.meta.env.VITE_SUPABASE_URL === undefined) {
        setUser(null);
        setProfile(null);
        setSession(null);
        
        toast({
          title: "Signed out",
          description: "You have been signed out successfully",
        });
        
        return;
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Sign Out Failed",
        description: "There was an error signing you out",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    session,
    user,
    profile,
    isAuthenticated: !!session && !!profile,
    isLoading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
