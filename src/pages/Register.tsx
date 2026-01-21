import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Heart, User, Mail, Lock, Phone, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useEffect, useMemo } from "react";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "patient",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availability, setAvailability] = useState<{ email?: boolean; phone?: boolean }>({});
  const [checking, setChecking] = useState<{ email: boolean; phone: boolean }>({ email: false, phone: false });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const roles = [
    { value: "patient", label: "Patient" },
    { value: "family", label: "Family Member" },
    { value: "doctor", label: "Doctor" },
    { value: "nurse", label: "Nurse" },
    { value: "pharmacy", label: "Pharmacy" },
    { value: "lab", label: "Lab Technician" },
    { value: "admin", label: "Admin" }
  ];

  // Roles that require admin approval
  const requiresApproval = ['doctor', 'nurse', 'pharmacy', 'lab', 'admin'];
  const selectedRoleRequiresApproval = formData.role && requiresApproval.includes(formData.role);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    } else if (availability.email === false) {
      newErrors.email = "Email already registered";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    } else if (availability.phone === false) {
      newErrors.phone = "Phone already registered";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Debounced values for availability checks
  const debouncedEmail = useDebouncedValue(formData.email.trim().toLowerCase(), 400);
  const debouncedPhone = useDebouncedValue(formData.phone.trim(), 400);

  // Live email validity
  const isEmailSyntaxValid = useMemo(() => {
    if (!debouncedEmail) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debouncedEmail);
  }, [debouncedEmail]);

  // Live phone validity (10 digits)
  const isPhoneSyntaxValid = useMemo(() => {
    if (!debouncedPhone) return false;
    return /^\d{10}$/.test(debouncedPhone);
  }, [debouncedPhone]);

  // Check email availability
  useEffect(() => {
    const run = async () => {
      if (!isEmailSyntaxValid) {
        setAvailability(prev => ({ ...prev, email: undefined }));
        return;
      }
      setChecking(prev => ({ ...prev, email: true }));
      try {
        const res = await fetch(`${API_BASE}/api/auth/check-email?email=${encodeURIComponent(debouncedEmail)}`);
        const data = await res.json();
        setAvailability(prev => ({ ...prev, email: Boolean(data?.available) }));
      } catch {
        setAvailability(prev => ({ ...prev, email: undefined }));
      } finally {
        setChecking(prev => ({ ...prev, email: false }));
      }
    };
    run();
  }, [debouncedEmail, isEmailSyntaxValid]);

  // Check phone availability
  useEffect(() => {
    const run = async () => {
      if (!isPhoneSyntaxValid) {
        setAvailability(prev => ({ ...prev, phone: undefined }));
        return;
      }
      setChecking(prev => ({ ...prev, phone: true }));
      try {
        const res = await fetch(`${API_BASE}/api/auth/check-phone?phone=${encodeURIComponent(debouncedPhone)}`);
        const data = await res.json();
        setAvailability(prev => ({ ...prev, phone: Boolean(data?.available) }));
      } catch {
        setAvailability(prev => ({ ...prev, phone: undefined }));
      } finally {
        setChecking(prev => ({ ...prev, phone: false }));
      }
    };
    run();
  }, [debouncedPhone, isPhoneSyntaxValid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Check the form for validation errors.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
          role: formData.role
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        const msg = data?.message || (res.status === 409 ? 'Email or phone already registered' : 'Registration failed');
        throw new Error(msg);
      }

      const requiresApprovalRoles = ['doctor', 'nurse', 'pharmacy', 'lab', 'admin'];
      const needsApproval = requiresApprovalRoles.includes(formData.role);

      toast({
        title: "Account created successfully!",
        description: needsApproval 
          ? `Your ${formData.role} account is pending admin approval. You'll be able to login once approved.`
          : `Welcome to Care Connect, ${formData.fullName}.`,
        duration: needsApproval ? 6000 : 3000
      });
      
      navigate('/login');
    } catch (err) {
      toast({ title: 'Registration error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = ["Weak", "Fair", "Good", "Strong"];
    const colors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-secondary"];
    
    return {
      strength,
      label: labels[strength - 1] || "",
      color: colors[strength - 1] || ""
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const canSubmit = useMemo(() => {
    const baseValid = formData.fullName.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim().toLowerCase()) &&
      /^\d{10}$/.test(formData.phone.trim()) &&
      !!formData.role &&
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword;
    const availabilityKnown = availability.email !== false && availability.phone !== false;
    const notChecking = !checking.email && !checking.phone;
    return Boolean(baseValid && availabilityKnown && notChecking);
  }, [formData, availability, checking]);

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-20">
        <div className="animate-gentle-float absolute top-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
        <div className="animate-gentle-float absolute bottom-20 left-10 w-24 h-24 bg-accent/10 rounded-full blur-xl" style={{ animationDelay: '2s' }}></div>
        <div className="animate-gentle-float absolute top-1/2 right-1/3 w-20 h-20 bg-primary/10 rounded-full blur-xl" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full max-w-lg animate-slide-up">
        <Card className="medical-card border-border/50 backdrop-blur-sm bg-card/80">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto p-3 bg-primary/10 rounded-2xl w-fit">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">Join Care Connect</CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Create your account and start your healthcare journey
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Dr. John Smith"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className={`medical-input ${errors.fullName ? 'border-destructive' : ''}`}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="text-destructive">⚠</span>
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.smith@hospital.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`medical-input ${errors.email ? 'border-destructive' : ''}`}
                />
                {checking.email && !errors.email && isEmailSyntaxValid && (
                  <p className="text-xs text-muted-foreground">Checking email availability…</p>
                )}
                {errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="text-destructive">⚠</span>
                    {errors.email}
                  </p>
                )}
                {!errors.email && isEmailSyntaxValid && availability.email === true && (
                  <p className="text-xs text-green-600">Email is available</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="1234567890"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={`medical-input ${errors.phone ? 'border-destructive' : ''}`}
                />
                {checking.phone && !errors.phone && isPhoneSyntaxValid && (
                  <p className="text-xs text-muted-foreground">Checking phone availability…</p>
                )}
                {errors.phone && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="text-destructive">⚠</span>
                    {errors.phone}
                  </p>
                )}
                {!errors.phone && isPhoneSyntaxValid && availability.phone === true && (
                  <p className="text-xs text-green-600">Phone is available</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`medical-input pr-12 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength.strength ? passwordStrength.color : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    {passwordStrength.label && (
                      <p className="text-xs text-muted-foreground">
                        Password strength: <span className="font-medium">{passwordStrength.label}</span>
                      </p>
                    )}
                  </div>
                )}
                
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="text-destructive">⚠</span>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={`medical-input pr-12 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="text-destructive">⚠</span>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !canSubmit}
                className="w-full btn-medical text-lg py-6 font-semibold mt-8"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>

              {/* Divider */}
              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <GoogleSignInButton 
                text="Sign up with Google"
                disabled={isLoading}
              />

              {/* Links */}
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:text-primary-dark font-medium transition-colors">
                  Sign in here
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};