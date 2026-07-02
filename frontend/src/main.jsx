import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios';

const defaultBackendUrl = 'https://itt-fov7.onrender.com';

// Use the deployed backend URL in production, but allow localhost in development.
const backendUrl = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL || defaultBackendUrl
  : defaultBackendUrl;

axios.defaults.baseURL = backendUrl;
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
