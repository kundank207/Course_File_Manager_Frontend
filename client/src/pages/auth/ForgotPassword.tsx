import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, KeyRound, CheckCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

// Schemas for each step
const emailSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  // Step 1: Send OTP
  const onSendOTP = async (values: z.infer<typeof emailSchema>) => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      const data = await res.json();

      if (res.ok) {
        setEmail(values.email);
        setMaskedEmail(data.email || values.email);
        setStep(2);
        toast({ title: "OTP Sent", description: "Check your email for the 6-digit code" });
      } else {
        toast({ title: "Error", description: data.error || "Failed to send OTP", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const onVerifyOTP = async (values: z.infer<typeof otpSchema>) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    try {
      const res = await fetch(`${baseUrl}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: values.otp }),
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        setOtp(values.otp);
        setStep(3);
        toast({ title: "OTP Verified", description: "Now set your new password" });
      } else {
        toast({ title: "Invalid OTP", description: data.error || "Please check the code", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to verify OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const onResetPassword = async (values: z.infer<typeof passwordSchema>) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    try {

      const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: values.newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setStep(4);
        toast({ title: "Success!", description: "Your password has been reset" });
      } else {
        toast({ title: "Error", description: data.error || "Failed to reset password", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to reset password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast({ title: "OTP Resent", description: "Check your email for the new code" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to resend OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 bg-indigo-900 text-white p-12 flex-col justify-between">
        <div>
          <h1 className="text-4xl font-bold">CourseFlow</h1>
          <p className="mt-4 text-indigo-200 max-w-sm">
            Reset your password securely
          </p>
        </div>
        <p className="text-indigo-300 text-sm">© 2026 CourseFlow</p>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/login" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <span className="text-sm text-muted-foreground">Back to login</span>
            </div>
            <CardTitle className="text-2xl font-bold">
              {step === 1 && "Forgot Password"}
              {step === 2 && "Enter OTP"}
              {step === 3 && "New Password"}
              {step === 4 && "Success!"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Enter your email to receive a verification code"}
              {step === 2 && `We sent a 6-digit code to ${maskedEmail}`}
              {step === 3 && "Create a strong new password"}
              {step === 4 && "Your password has been reset successfully"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* STEP 1: Email */}
            {step === 1 && (
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onSendOTP)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="name@example.com" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Sending...</> : "Send OTP"}
                  </Button>
                </form>
              </Form>
            )}

            {/* STEP 2: OTP */}
            {step === 2 && (
              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(onVerifyOTP)} className="space-y-4">
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>6-Digit Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="000000"
                            maxLength={6}
                            className="text-center text-2xl tracking-widest font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Verifying...</> : "Verify OTP"}
                  </Button>
                  <div className="text-center text-sm text-muted-foreground">
                    Didn't receive the code?{" "}
                    <button type="button" onClick={resendOTP} className="text-primary hover:underline" disabled={loading}>
                      Resend OTP
                    </button>
                  </div>
                </form>
              </Form>
            )}

            {/* STEP 3: New Password */}
            {step === 3 && (
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onResetPassword)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="password" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="password" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Resetting...</> : "Reset Password"}
                  </Button>
                </form>
              </Form>
            )}

            {/* STEP 4: Success */}
            {step === 4 && (
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <p className="text-muted-foreground">You can now login with your new password</p>
                <Button className="w-full" onClick={() => navigate("/login")}>
                  Go to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
