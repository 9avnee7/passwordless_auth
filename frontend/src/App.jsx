
import './App.css'
import { Children, useEffect } from 'react';
import {createBrowserRouter , RouterProvider } from "react-router-dom";
import { useContext } from 'react';
import { GlobalContext } from './index';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Secure from './components/Secure';
import OTP from './components/OTP'



const router=createBrowserRouter([
  {
    path:'/login',
    element: <div>
      <Login/>
    </div>
  },
  {
    path:'/',
    element: <div>
     <Home/>
    
    </div>
  },
  {
    path:'/home',
    element: <div>
     <Home/>
    
    </div>
  },
  {
    path:'/register',
    element: <div>
      <Register/>
    </div>
  },
  {
    path:'/dashboard',
    element: <ProtectedRoute/>,
    children:[{
      path:'',
      element:
        <div>
          <Secure/>  
        </div>
      
    }]

  },
  {
    path:'/otp',
    element: <div>
      <OTP/>
    </div>
  },
  // {
  //   path:'/dashboard',
  
  //     element:
  //       <div>
  //         </div>

  // }
])

function App() {

  const { setAccessToken, setLoggedIn, setUserInfo, userInfo, setLoading } = useContext(GlobalContext);

  const refresh = async () => {
    try {
      
        console.log("Refreshing token on refresh");
        const res = await fetch(`${import.meta.env.VITE_IDENTITY_SERVICE_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include",
        });

        const data = await res.json();
        console.log(data);
        console.log(data.userId);

        const userInfoFromSessionStorage=JSON.parse(sessionStorage.getItem('userInfo'));
        console.log("user infot from session on refresh",userInfoFromSessionStorage)
        if(!userInfoFromSessionStorage){
          console.log("userinfor from session",userInfoFromSessionStorage)

            if (res.ok) {
                const userDataResponse = await fetch(`${import.meta.env.VITE_IDENTITY_SERVICE_URL}/auth/fetchuserdata`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "x-user-id": data?.userId,
                        "Authorization": `Bearer ${data.accessToken}`,
                        "Content-Type": "application/json"
                    }
                });

                if (userDataResponse.ok) {
                    const userData = await userDataResponse.json();
                    console.log(userData)
                    sessionStorage.setItem('userInfo',JSON.stringify(userData));
                    const updatedUserInfo = JSON.parse(sessionStorage.getItem('userInfo'));
                    setUserInfo(updatedUserInfo);
                    console.log(JSON.parse(userInfoFromSessionStorage))
                    setAccessToken(data.accessToken);
                    setLoggedIn(true);
                    console.log("User Info Updated:", userInfo);
                } else {
                    setUserInfo(null);
                    console.log("error in fetching user info");
                }
            } 
        
            else {
                  setAccessToken(null);
                  setLoggedIn(false);
              }
        } 
        else{
          console.log("userinfor from else",userInfoFromSessionStorage)

          setUserInfo((userInfoFromSessionStorage));
          setAccessToken(data.accessToken);
          setLoggedIn(true);
          console.log('User info updated from session storage')
        }
} catch (e) {
        console.error("Error occurred on refreshing refreshToken", e);
        setAccessToken(null);
        setLoggedIn(false);
    }finally{
      setLoading(false);
    }
};
  
   useEffect(()=>{
      refresh();
      const interval=setInterval(()=>{
      refresh();
      },14*60*1000)

      return ()=>clearInterval(interval);

   },[])
   useEffect(() => {
    console.log("Updated userInfo:", userInfo);
    sessionStorage.setItem('userInfo',JSON.stringify(userInfo))
}, [userInfo]);

  return (
    <>
     <RouterProvider router={router}/>
    </>
  )
}

export default App






