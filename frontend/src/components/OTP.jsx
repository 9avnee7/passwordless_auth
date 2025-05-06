import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { GlobalContext } from '..';
const OTP = () => {
  const [email, setEmail] = useState('');
  const [otp, setOTP] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const navigate=useNavigate();
  const { 
      setAccessToken, 
      setLoggedIn, 
      setUserInfo, 
    } = useContext(GlobalContext);

  const handleSendOTP = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_IDENTITY_SERVICE_URL}/api/auth/send-otp`, { email }); // Adjust route if needed
      setEmailSent(true);
      setMessage('OTP sent to your email.');
    } catch (err) {
      console.error(err);
      setMessage('Failed to send OTP.');
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setVerifying(true);
      const {data} = await axios.post(`${import.meta.env.VITE_IDENTITY_SERVICE_URL}/api/auth/verify-otp`, { email, otp }); // Adjust route if needed
      setMessage('OTP Verified! Backup Auth Activated.');
       // 4. On success, update global state and localStorage
       localStorage.setItem('accessToken', data.accessToken);
       localStorage.setItem('refreshToken', data.refreshToken);
    
       console.log(data)
       setAccessToken(data.accessToken);
       setLoggedIn(true);
       
       // 5. Fetch and set user info if available
       if (data.user) {
         localStorage.setItem('userInfo', JSON.stringify(data.user));
         setUserInfo(data.user);
       } else {
         // Fetch user data if not included in response
         const userResponse = await axios.get(
           `${import.meta.env.VITE_IDENTITY_SERVICE_URL}/api/auth/fetchuserdata`,
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
    } catch (err) {
      console.error(err);
      setMessage('Invalid OTP. Try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Activate Backup OTP Login</h2>

        <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          disabled={emailSent}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="you@example.com"
        />

        {!emailSent ? (
          <button
            onClick={handleSendOTP}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Generate OTP
          </button>
        ) : (
          <>
            <label className="block mt-4 mb-2 text-sm font-medium text-gray-700">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOTP(e.target.value)}
              className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter OTP"
            />

            <button
              onClick={handleVerifyOTP}
              disabled={verifying}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
            >
              {verifying ? 'Verifying...' : 'Verify OTP'}
            </button>
          </>
        )}

        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
};

export default OTP;
