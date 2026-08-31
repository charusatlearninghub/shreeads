import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Phone, Loader2, CheckCircle2, XCircle, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

async function quickFingerprint(): Promise<string> {
  try {
    const parts = [navigator.userAgent, navigator.language, screen.width + 'x' + screen.height, new Date().getTimezoneOffset(), navigator.platform].join('|');
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch { return ''; }
}
import logo from "@/assets/new-logo.png";

const Register = () => {
  const [searchParams] = useSearchParams();
  const prefilledRef = (searchParams.get("ref") || "").toUpperCase();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referralCode: prefilledRef,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Referral validation
  const [refStatus, setRefStatus] = useState<"idle" | "checking" | "valid" | "invalid">(prefilledRef ? "checking" : "idle");
  const [refSponsorName, setRefSponsorName] = useState<string>("");
  const [refError, setRefError] = useState<string>("");

  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === "referralCode" ? value.toUpperCase() : value }));
    if (name === "referralCode") {
      setRefStatus("idle");
      setRefSponsorName("");
      setRefError("");
    }
  };

  // Debounced referral validation
  useEffect(() => {
    const code = formData.referralCode.trim();
    if (!code) { setRefStatus("idle"); return; }
    setRefStatus("checking");
    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc("validate_referral_code", { _code: code });
        if (error) throw error;
        const result = data as any;
        if (result?.valid) {
          setRefStatus("valid");
          setRefSponsorName(result.sponsor_name || "");
          setRefError("");
        } else {
          setRefStatus("invalid");
          setRefError(result?.error || "Invalid referral code");
        }
      } catch (e: any) {
        setRefStatus("invalid");
        setRefError("Could not verify referral code. Please try again.");
      }
    }, 450);
    return () => clearTimeout(t);
  }, [formData.referralCode]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.referralCode.trim()) {
      toast({
        title: "Referral code required",
        description: "You need a sponsor's referral code to create an account.",
        variant: "destructive",
      });
      return false;
    }

    if (refStatus !== "valid") {
      toast({
        title: "Invalid referral code",
        description: refError || "Please enter a valid sponsor code.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    const fp = await quickFingerprint();
    const refCode = formData.referralCode.trim().toUpperCase();
    
    const { error } = await signUp(
      formData.email.trim(),
      formData.password,
      formData.name.trim(),
      refCode,
      formData.phone.trim() || undefined
    );
    
    // Log signup attempt (best-effort, ignore errors)
    supabase.from("signup_attempts").insert({
      email: formData.email.trim().toLowerCase(),
      device_fingerprint: fp || null,
      referral_code: refCode,
      success: !error,
      reason: error?.message || null,
    }).then(() => {}, () => {});
    
    setIsLoading(false);
    
    if (error) {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Check your email",
      description: "We sent you a confirmation link. Verify your email to activate your account.",
    });
    navigate("/login");
  };


  return (
    <div className="min-h-screen flex bg-gradient-surface relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <img src={logo} alt="SHREE ADS" className="h-14 w-auto object-contain drop-shadow-md" />
          </div>

          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>
                Join thousands of learners and start your journey
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">


              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-12"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-12"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="tel"
                      name="phone"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-12"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create password"
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-12"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Confirm
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-12 pr-10"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Referral Code <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      name="referralCode"
                      placeholder="Enter your sponsor's referral code"
                      value={formData.referralCode}
                      onChange={handleChange}
                      className="pl-12 pr-10 uppercase"
                      required
                      disabled={isLoading}
                      autoComplete="off"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {refStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                      {refStatus === "valid" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {refStatus === "invalid" && <XCircle className="w-4 h-4 text-destructive" />}
                    </div>
                  </div>
                  {refStatus === "valid" && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      ✓ Sponsor: <span className="font-semibold">{refSponsorName}</span>
                    </p>
                  )}
                  {refStatus === "invalid" && (
                    <p className="text-xs text-destructive">{refError}</p>
                  )}
                  {refStatus === "idle" && (
                    <p className="text-xs text-muted-foreground">
                      A valid sponsor referral code is required to sign up.
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  variant="hero" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By creating an account, you agree to our{" "}
                  <Link to="/terms" className="text-primary hover:underline">Terms</Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </p>
              </form>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground text-sm">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary font-semibold hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-muted-foreground text-sm mt-6">
            <Link to="/" className="hover:text-primary transition-colors">
              ← Back to Home
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary via-purple-600 to-pink-500" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/" className="mb-12 inline-flex">
              <img src={logo} alt="SHREE ADS" className="h-16 w-auto object-contain drop-shadow-lg" />
            </Link>

            <h1 className="font-display text-4xl font-bold mb-6 leading-tight">
              Start Your Success<br />Story Today
            </h1>
            <p className="text-lg opacity-90 mb-8 max-w-md">
              Join our community of learners and transform your career with premium video courses.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="text-lg">✨</span>
                </div>
                <span>Premium Quality Content</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="text-lg">🔒</span>
                </div>
                <span>Secure Learning Environment</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="text-lg">💫</span>
                </div>
                <span>Lifetime Access to Courses</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
