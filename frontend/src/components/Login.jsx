import React, { useState, useContext } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from '..';

const Login = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Access GlobalContext states and setters
  const { 
    setAccessToken, 
    setLoggedIn, 
    setUserInfo,
    setLoading 
  } = useContext(GlobalContext);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    setIsLoading(true);
    
    try {
      // 1. Start authentication - get options from backend
      const { data: options } = await axios.post(
        `${import.meta.env.VITE_IDENTITY_SERVICE_URL}/auth/login-start`, 
        { email }
      );

      // 2. Trigger browser's WebAuthn API
      const assertion = await startAuthentication(options);

      // 3. Send assertion to backend for verification
      const { data } = await axios.post(
        `${import.meta.env.VITE_IDENTITY_SERVICE_URL}/auth/login-finish`,
        { 
          email,
          assertionResponse: assertion 
        },
        {
          withCredentials: true, // This is crucial for sending cookies
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // 4. On success, update global state and localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      setAccessToken(data.accessToken);
      setLoggedIn(true);
      
      // 5. Fetch and set user info if available
      if (data.user) {
        localStorage.setItem('userInfo', JSON.stringify(data.user));
        setUserInfo(data.user);
      } else {
        // Fetch user data if not included in response
        const userResponse = await axios.get(
          `${import.meta.env.VITE_IDENTITY_SERVICE_URL}/auth/fetchuserdata`,
          {
            headers: {
              Authorization: `Bearer ${data.accessToken}`
            }
          }
        );
        localStorage.setItem('userInfo', JSON.stringify(userResponse.data.userData));
        setUserInfo(userResponse.data.userData);
      }

      // 6. Redirect to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific WebAuthn errors
      if (error.name === 'NotAllowedError') {
        setError('Login cancelled by user');
      } else if (error.name === 'InvalidStateError') {
        setError('Authentication error - please try again');
      } else {
        setError(
          error.response?.data?.error || 
          'Login failed. Please try again.'
        );
      }
      
      // Clear auth state on error
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
      setAccessToken(null);

      setLoggedIn(false);
      setUserInfo(null);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Login</h2>
        
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className={`w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Logging in...' : 'Login with Biometrics'}
        </button>

        <div className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button 
          onClick={() => navigate('/register')} 
          className="text-blue-600 hover:underline"
        >
          Register now
        </button>
        <div className="mt-2">
          <button 
            onClick={() => navigate('/otp')} 
            className="text-blue-600 hover:underline"
          >
            Forgot Password?
          </button>
        </div>
      </div>

      </div>
    </div>
  );
};

export default Login;