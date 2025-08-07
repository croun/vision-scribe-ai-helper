import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectPath?: string;
}

export const LoginForm = ({ onSuccess, redirectPath }: LoginFormProps) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      console.log('Login attempt:', { email, password });

      if (onSuccess) onSuccess();
      if (redirectPath) {
        navigate(redirectPath);
      } else if (!onSuccess) {
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      // You can add a toast or alert here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#36393f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#2f3136] rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">Welcome back!</h1>
            <p className="text-[#b9bbbe] text-sm">We're so excited to see you again!</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2 block">
                Email or Phone Number *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#202225] border-none text-white placeholder-[#72767d] focus:ring-2 focus:ring-[#5865f2] h-10"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2 block">
                Password *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#202225] border-none text-white placeholder-[#72767d] focus:ring-2 focus:ring-[#5865f2] h-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b9bbbe] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <button type="button" className="text-[#00a8fc] text-sm hover:underline">
                Forgot your password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium h-11 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>

            <div className="text-sm text-[#b9bbbe]">
              Need an account?{' '}
              <button type="button" className="text-[#00a8fc] hover:underline">
                Register
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-[#b9bbbe] text-xs">
            By logging in, you agree to Discord's{' '}
            <button className="text-[#00a8fc] hover:underline">Terms of Service</button> and{' '}
            <button className="text-[#00a8fc] hover:underline">Privacy Policy</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;