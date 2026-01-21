import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Heart, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      console.log('Attempting to log in to:', `${backendUrl}/api/auth/login`);
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: formData.email.trim().toLowerCase(), 
          password: formData.password
        }),
        credentials: 'include' // Important for httpOnly cookies
      });

      if (!res.ok) {
        console.log('Response status:', res.status);
        const errorText = await res.text();
        console.log('Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error(`Server responded with status ${res.status}: ${errorText}`);
        }
        throw new Error(errorData.message || `Server responded with status ${res.status}`);
      }

      const responseData = await res.json();
      console.log('Login response:', responseData);
      
      // Map server response to expected format
      const { token, user } = responseData;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      // Store tokens in localStorage
      localStorage.setItem('authToken', token);
      
      // Store user info
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userName', user.name || user.email?.split('@')[0] || 'User');
      localStorage.setItem('userId', user.id || user._id || '');

      // Set default headers for future requests
      // apiRequest.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Redirect based on role - always use dashboard path for consistency
      // For admin role, use /dashboard/admin instead of /admin
      const redirectPath = user.role === 'admin' ? '/dashboard/admin' : `/dashboard/${user.role}`;
      
      toast({ 
        title: "Welcome back!", 
        description: `Successfully logged in as ${user.role}.`,
        duration: 2000
      });
      
      // Small delay before navigation to allow toast to show
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 500);
      
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Clear any existing tokens on error
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      toast({ 
        title: 'Login Failed', 
        description: err.message || 'Invalid username or password. Please try again.', 
        variant: 'destructive',
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-20">
        <div className="animate-gentle-float absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-xl"></div>
        <div className="animate-gentle-float absolute bottom-1/4 right-1/4 w-24 h-24 bg-secondary/10 rounded-full blur-xl" style={{ animationDelay: '3s' }}></div>
        <div className="animate-gentle-float absolute top-3/4 left-3/4 w-20 h-20 bg-accent/10 rounded-full blur-xl" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md animate-slide-up">
        <Card className="medical-card border-border/50 backdrop-blur-sm bg-card/80">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto p-3 bg-primary/10 rounded-2xl w-fit">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">Welcome Back</CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Sign in to your Care Connect account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="medical-input"
                  autoComplete="username email"
                  aria-required="true"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="medical-input pr-12"
                    autoComplete="current-password"
                    aria-required="true"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1 rounded-full hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    aria-controls="password"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-medical text-lg py-6 font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <GoogleSignInButton 
                text="Sign in with Google"
                disabled={isLoading}
              />

              {/* Links */}
              <div className="text-center space-y-2">
                <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-dark transition-colors">
                  Forgot your password?
                </Link>
                <div className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-primary hover:text-primary-dark font-medium transition-colors">
                    Create one here
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};