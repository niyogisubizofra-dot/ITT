import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios';

const defaultBackendUrl = 'https://itt-fov7.onrender.com';

// Configure global Axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || defaultBackendUrl;
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
