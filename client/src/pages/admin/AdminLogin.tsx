import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/contexts/AuthContext";

const adminLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function AdminLoginPage() {
  const { login, getRoleBasedRedirect } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  });

  async function onSubmit(values: any) {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
        return;
      }

      // Backend returns activeRole, but some parts might use role
      const userRole = (data.activeRole || data.role) as UserRole;

      if (userRole !== "ADMIN") {
        toast({
          title: "Access Denied",
          description: "Only administrators can access this portal.",
          variant: "destructive",
        });
        return;
      }

      // Extract user data from backend response
      const userData = {
        id: data.id,
        username: data.username || data.email,
        email: data.email,
        role: userRole,
        teacherId: data.teacherId,
        token: data.token,
      };

      // Save user to AuthContext (also saves to localStorage)
      login(data);

      toast({
        title: "Admin Access Granted",
        description: "Welcome to the Admin Console!",
      });

      // Redirect to admin dashboard
      const redirectPath = getRoleBasedRedirect(userRole);
      navigate(redirectPath);

    } catch (err) {
      toast({
        title: "Server Error",
        description: "Could not connect to backend.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950">

      <Card className="w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl text-slate-50 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Portal</CardTitle>
          <CardDescription className="text-slate-400">Administrator credentials required</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Email</FormLabel>
                    <FormControl>
                      <Input className="bg-slate-950/50 border-slate-800 text-slate-50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          className="bg-slate-950/50 border-slate-800 text-slate-50"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-300"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Access Dashboard
              </Button>

            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex justify-center pb-4">
          <Link to="/login">
            <span className="text-sm text-slate-500 hover:text-blue-400 cursor-pointer">
              Back to User Login
            </span>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
