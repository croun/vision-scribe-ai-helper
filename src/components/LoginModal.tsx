import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoginForm } from '@/components/LoginForm';
import { RegistrationForm} from '@/components/RegistrationForm';
import { X } from 'lucide-react';

interface LoginModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Made optional
  redirectPath?: string; // Made optional to match usage
}
interface RegistrationFormProps {
  onSuccess?: () => void
  redirectPath?: string
}

export const LoginModal = ({ show, onClose, onSuccess, redirectPath }: LoginModalProps) => {
  const [isLogin, setIsLogin] = useState(true);

  if (!show) return null;

  const handleSuccess = () => {
    onClose(); // Close the modal
    onSuccess?.(); // Call the optional success callback if provided
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="p-6">
          {isLogin ? (
            <>
              <LoginForm 
                onSuccess={handleSuccess}
                redirectPath={redirectPath}
              />
              <div className="mt-4 text-center text-sm">
                Don't have an account?{' '}
                <button 
                  onClick={() => setIsLogin(false)}
                  className="text-blue-600 hover:underline"
                >
                  Register
                </button>
              </div>
            </>
          ) : (
            <>
              <RegistrationForm 
                onSuccess={handleSuccess}
                redirectPath={redirectPath}
              />
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <button 
                  onClick={() => setIsLogin(true)}
                  className="text-blue-600 hover:underline"
                >
                  Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};