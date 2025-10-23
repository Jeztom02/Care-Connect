import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      toast({
        title: 'Google Sign-in Failed',
        description: 'There was an error signing in with Google. Please try again.',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Store authentication data
        localStorage.setItem('authToken', token);
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('userName', user.name || user.email.split('@')[0] || 'User');
        if (user.profilePicture) {
          localStorage.setItem('userProfilePicture', user.profilePicture);
        }

        toast({
          title: 'Welcome!',
          description: `Successfully signed in with Google as ${user.role}.`
        });

        navigate(`/dashboard/${user.role}`);
      } catch (err) {
        console.error('Error parsing user data:', err);
        toast({
          title: 'Sign-in Error',
          description: 'There was an error processing your sign-in. Please try again.',
          variant: 'destructive'
        });
        navigate('/login');
      }
    } else {
      toast({
        title: 'Sign-in Error',
        description: 'Missing authentication data. Please try again.',
        variant: 'destructive'
      });
      navigate('/login');
    }
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing your sign-in...</p>
      </div>
    </div>
  );
};

