import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff } from 'lucide-react';
<<<<<<< HEAD

export const RegistrationForm = () => {
=======
import { useNavigate } from 'react-router-dom';

interface RegistrationFormProps {
  onSuccess?: () => void;
  redirectPath?: string;
}

export const RegistrationForm = ({ onSuccess, redirectPath }: RegistrationFormProps) => {
  const navigate = useNavigate();

>>>>>>> ellema
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
<<<<<<< HEAD
    
=======

>>>>>>> ellema
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (!agreeTerms) {
      alert("You must agree to the terms and conditions");
      return;
    }

    setIsLoading(true);
<<<<<<< HEAD
    
    // Simulate registration process
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    
    console.log('Registration data:', { firstName, lastName, username, email, password });
=======

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
      console.log('Registration data:', {
        firstName,
        lastName,
        username,
        email,
        password
      });

      if (onSuccess) onSuccess();
      if (redirectPath) {
        navigate(redirectPath);
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
>>>>>>> ellema
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">
              Create your account
            </h1>
<<<<<<< HEAD
            <p className="text-gray-600 text-sm">
              Join our community today
            </p>
=======
            <p className="text-gray-600 text-sm">Join our community today</p>
>>>>>>> ellema
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
<<<<<<< HEAD
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-gray-700 text-sm font-medium mb-2 block">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 h-10"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-gray-700 text-sm font-medium mb-2 block">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 h-10"
                  required
                />
              </div>
            </div>

            {/* Username Field */}
            <div>
              <Label htmlFor="username" className="text-gray-700 text-sm font-medium mb-2 block">
                Username *
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 h-10"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <Label htmlFor="email" className="text-gray-700 text-sm font-medium mb-2 block">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 h-10"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="text-gray-700 text-sm font-medium mb-2 block">
                Password *
              </Label>
=======
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>

            <div>
              <Label htmlFor="username">Username *</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
>>>>>>> ellema
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
<<<<<<< HEAD
                  className="bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 h-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
=======
                  required
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
>>>>>>> ellema
                </button>
              </div>
            </div>

<<<<<<< HEAD
            {/* Confirm Password Field */}
            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700 text-sm font-medium mb-2 block">
                Confirm Password *
              </Label>
=======
            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
>>>>>>> ellema
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
<<<<<<< HEAD
                  className="bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 h-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
=======
                  required
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
>>>>>>> ellema
                </button>
              </div>
            </div>

<<<<<<< HEAD
            {/* Terms Checkbox */}
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="terms" 
                checked={agreeTerms}
                onCheckedChange={() => setAgreeTerms(!agreeTerms)}
                className="border-gray-300"
              />
              <Label htmlFor="terms" className="text-sm text-gray-700">
                I agree to the <span className="text-blue-600 hover:underline cursor-pointer">Terms of Service</span> and <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
              </Label>
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              disabled={isLoading || !firstName || !lastName || !username || !email || !password || !confirmPassword || !agreeTerms}
=======
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={() => setAgreeTerms(!agreeTerms)}
              />
              <Label htmlFor="terms" className="text-sm text-gray-700">
                I agree to the <span className="text-blue-600 hover:underline">Terms of Service</span> and{' '}
                <span className="text-blue-600 hover:underline">Privacy Policy</span>
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
>>>>>>> ellema
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>

<<<<<<< HEAD
            {/* Login Link */}
            <div className="text-sm text-center text-gray-600 pt-2">
              Already have an account?{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline font-medium"
              >
=======
            <div className="text-sm text-center text-gray-600 pt-2">
              Already have an account?{' '}
              <button type="button" className="text-blue-600 hover:underline font-medium">
>>>>>>> ellema
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
<<<<<<< HEAD
};
=======
};
>>>>>>> ellema
