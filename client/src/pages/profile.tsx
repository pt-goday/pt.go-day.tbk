import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, Check, Upload, X } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
// Not using apiRequest directly because of type mismatch in our development build
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(profile?.avatar_url || null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      email: profile?.email || user?.email || "",
      phone: "",
      address: "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // In development mode without backend, simulate success
      // In a real implementation, this would call an API to update the profile
      
      // Mock API for development
      setTimeout(() => {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
        
        setIsEditing(false);
      }, 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview the image
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImagePreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // In a real implementation, this would upload the image to Supabase storage
    setIsUploading(true);

    try {
      // Mock upload success after delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const cardClass = theme === "dark" ? "bg-gray-800" : "bg-white";
  const borderClass = theme === "dark" ? "border-gray-700" : "border-gray-200";
  
  return (
    <PageLayout title="My Profile">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`${cardClass} p-6 rounded-lg shadow-md border ${borderClass} col-span-1`}
        >
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className={`h-28 w-28 rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} flex items-center justify-center overflow-hidden mb-4`}>
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-medium">{profile?.username?.charAt(0)?.toUpperCase()}</span>
                )}
              </div>
              
              <label 
                htmlFor="avatar-upload" 
                className={`absolute bottom-4 right-0 p-2 rounded-full cursor-pointer ${theme === "dark" ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} transition-colors duration-200`}
              >
                <Camera size={16} className="text-primary" />
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
            
            <h2 className="text-xl font-bold mt-2">{profile?.full_name || profile?.username}</h2>
            <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"} capitalize`}>{profile?.role}</p>
            
            <div className="mt-6 w-full">
              <div className={`flex justify-between py-2 ${theme === "dark" ? "border-gray-700" : "border-gray-100"} border-b`}>
                <span className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Username</span>
                <span className="font-medium">{profile?.username}</span>
              </div>
              <div className={`flex justify-between py-2 ${theme === "dark" ? "border-gray-700" : "border-gray-100"} border-b`}>
                <span className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Email</span>
                <span className="font-medium">{profile?.email || user?.email || "Not set"}</span>
              </div>
              <div className={`flex justify-between py-2 ${theme === "dark" ? "border-gray-700" : "border-gray-100"} border-b`}>
                <span className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Role</span>
                <span className="font-medium capitalize">{profile?.role}</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Edit Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`${cardClass} p-6 rounded-lg shadow-md border ${borderClass} col-span-1 md:col-span-2`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Profile Information</h2>
            
            {!isEditing ? (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                >
                  <X size={16} className="mr-1" /> Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={form.handleSubmit(onSubmit)}
                >
                  <Check size={16} className="mr-1" /> Save
                </Button>
              </div>
            )}
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!isEditing}
                        placeholder="Your full name"
                        className={theme === "dark" ? "bg-gray-700 border-gray-600" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!isEditing}
                        placeholder="your.email@example.com"
                        className={theme === "dark" ? "bg-gray-700 border-gray-600" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditing}
                          placeholder="Your phone number"
                          className={theme === "dark" ? "bg-gray-700 border-gray-600" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditing}
                          placeholder="Your address"
                          className={theme === "dark" ? "bg-gray-700 border-gray-600" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </PageLayout>
  );
}