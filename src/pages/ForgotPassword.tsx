import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      toast({ title: 'Check your email', description: 'If the email exists, a reset link has been sent.' });
      navigate('/login');
    } catch (_err) {
      toast({ title: 'Check your email', description: 'If the email exists, a reset link has been sent.' });
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="w-full max-w-md animate-slide-up">
        <Card className="medical-card border-border/50 backdrop-blur-sm bg-card/80">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">Forgot Password</CardTitle>
            <CardDescription className="text-muted-foreground">Enter your registered email to receive a reset link.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="medical-input" />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full btn-medical py-6 font-semibold">
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;






