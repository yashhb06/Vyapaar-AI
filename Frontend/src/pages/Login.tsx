import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Shield, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { authAPI } from "@/lib/api";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.sendOTP(phone);
      if (response.data.success) {
        setStep("otp");
        toast({
          title: "OTP Sent!",
          description: "Please check your phone for the verification code",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(phone, otp);

      toast({
        title: "Login Successful!",
        description: "Welcome to Vyapaar - AI",
      });

      // Redirect based on vendor profile status
      if (response.hasVendorProfile) {
        navigate("/dashboard");
      } else {
        navigate("/complete-signup");
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.response?.data?.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Vyapaar - AI</h1>
          <p className="text-white/80">AI Tools for Indian Businesses</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">
              {step === "phone" ? "Login to Continue" : "Verify OTP"}
            </CardTitle>
            <CardDescription>
              {step === "phone"
                ? "Enter your phone number to get started"
                : `Code sent to +91 ${phone}`
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === "phone" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 bg-muted rounded-l-lg border border-r-0">
                      <span className="text-sm text-muted-foreground">+91</span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleSendOTP}
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send OTP"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-lg tracking-widest"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => setStep("phone")}
                  >
                    Back
                  </Button>
                  <Button
                    variant="hero"
                    size="lg"
                    className="flex-1"
                    onClick={handleVerifyOTP}
                    disabled={isLoading}
                  >
                    {isLoading ? "Verifying..." : "Verify"}
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={handleSendOTP}
                >
                  Didn't receive code? Resend
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <Shield className="w-4 h-4" />
              <span>Secured with end-to-end encryption</span>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button variant="link" className="text-white/80 hover:text-white" onClick={() => navigate("/")}>
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;