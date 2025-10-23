import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!password || password !== confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Invalid or expired link' }));
        throw new Error(data.message || 'Invalid or expired link');
      }

      toast({ title: 'Password updated successfully' });
      navigate('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid or expired link';
      toast({ title: 'Reset failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="w-full max-w-md animate-slide-up">
        <Card className="medical-card border-border/50 backdrop-blur-sm bg-card/80">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">Reset Password</CardTitle>
            <CardDescription className="text-muted-foreground">Enter and confirm your new password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="medical-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="medical-input" />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full btn-medical py-6 font-semibold">
                {isLoading ? 'Resetting...' : 'Set New Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;






