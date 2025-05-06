import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from '..';

const Home = () => {
  const navigate = useNavigate();
  const { 
      setAccessToken, 
      setLoggedIn, 
      setUserInfo,

      loggedIn
    } = useContext(GlobalContext);

    const handleLogOut=async()=>{
      await fetch(`${import.meta.env.VITE_IDENTITY_SERVICE_URL}/api/auth/logout`,{
        method:'POST',
        credentials:"include"
      })
      sessionStorage.clear()
      setAccessToken(null)
      setLoggedIn(false);
      navigate('/')
      setUserInfo(null);
    }
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Welcome</h1>

      {!loggedIn? <div className="flex gap-6">
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
        >
          Login
        </button>
        <button
          onClick={() => navigate('/register')}
          className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
        >
          Register
        </button>
      </div>:  
      <button
          onClick={() => handleLogOut()}
          className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
        >
          Log Out
        </button>}
    </div>
  );
};

export default Home;
