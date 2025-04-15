
import React from 'react';
import { HeartPulse } from 'lucide-react';
import SignupForm from '../components/SignupForm';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const Signup = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-wellness-light p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-white rounded-full shadow-sm mb-4">
            <HeartPulse size={40} className="text-wellness-teal" />
          </div>
          <h1 className="text-3xl font-bold text-wellness-dark">Create Account</h1>
          <p className="text-wellness-dark/80 mt-2">
            Join us in creating a supportive workplace environment
          </p>
        </div>
        
        <SignupForm />
        
        <div className="mt-8">
          <MedicalDisclaimer />
        </div>
        
        <p className="text-center text-sm text-gray-500 mt-8">
          © {new Date().getFullYear()} Preventing Suicide. A college minor project. Not for commercial use.
        </p>
      </div>
    </div>
  );
};

export default Signup;
