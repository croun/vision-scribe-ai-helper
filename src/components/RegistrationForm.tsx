import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff } from 'lucide-react';

export interface RegistrationFormProps {
  onSuccess?: () => void;
  redirectPath?: string;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess, redirectPath }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (!agreeTerms) {
      alert("You must agree to the terms and conditions");
      return;
    }

    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    console.log('Registration data:', { firstName, lastName, username, email, password });

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="w-full">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-transparent p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">
              Create your account
            </h1>
            <p className="text-gray-600 text-sm">Join our community today</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2 block">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2 block">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="username" className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2 block">
                Username *
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2 block">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-2 block">
                Confirm Password *
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={() => setAgreeTerms(!agreeTerms)}
                className="border-gray-300"
              />
              <Label htmlFor="terms" className="text-sm text-gray-700">
                I agree to the{' '}
                <span className="text-blue-600 hover:underline cursor-pointer">Terms of Service</span>{' '}
                and{' '}
                <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !firstName || !lastName || !username || !email || !password || !confirmPassword || !agreeTerms}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>

            <div className="text-sm text-center text-gray-600 pt-2">
              Already have an account?{' '}
              <button type="button" className="text-blue-600 hover:underline font-medium">
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
