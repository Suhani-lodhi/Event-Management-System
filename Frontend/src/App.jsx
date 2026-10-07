import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './App.css';

export default function App() {
  return (  
      <>
        <AuthProvider>
        <AppRoutes />
      </AuthProvider>    
       <ToastContainer position="top-right" autoClose={3000} />
      </>
  );
}