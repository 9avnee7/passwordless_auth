import React, { useContext } from 'react'
import { Navigate,Outlet } from 'react-router-dom'
import { GlobalContext } from '..';


const ProtectedRoute = () => {
  const {loading,loggedIn}=useContext(GlobalContext);
    // console.log('userinfo:',userInfo)
    if(loading){
        return <p>Loading......</p>
    }

    const userInfo=JSON.parse(sessionStorage.getItem('userInfo'));
    console.log("protected route hit",userInfo,loggedIn)

    return userInfo  ? <Outlet/>:<Navigate to="/" replace />
}

export default ProtectedRoute
