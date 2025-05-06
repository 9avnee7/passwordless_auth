import React, { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      // 1. Start registration - get options from backend
      const { data: options } = await axios.post(
        'http://localhost:3000/auth/register-start', 
        { username, email }
      );

      
      // 2. Trigger browser's WebAuthn API
      const attestation = await startRegistration(options);

      // 3. Send attestation to backend for verification
      const { data } = await axios.post(
        'http://localhost:3000/auth/register-finish',
        { email, attestationResponse: attestation },
        {
          withCredentials: true, // This is crucial for sending cookies
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // 4. On success, store tokens and redirect
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Registration error:', error);
      setError(
        error.response?.data?.error || 
        error.message || 
        'Registration failed. Please try again.'
      );
      
      // Handle specific WebAuthn errors
      if (error.name === 'NotAllowedError') {
        setError('Registration cancelled by user');
      } else if (error.name === 'InvalidStateError') {
        setError('This device is already registered');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Register</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
        <button
          onClick={handleRegister}
          disabled={isLoading}
          className={`w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Registering...' : 'Register with Biometrics'}
        </button>

        <div className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button 
            onClick={() => navigate('/login')} 
            className="text-green-600 hover:underline"
          >
            Login instead
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;