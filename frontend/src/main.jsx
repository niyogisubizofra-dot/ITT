import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios';

// Use VITE_API_URL env var for separate frontend/backend deployments.
// Default to empty string so API calls are relative (same-origin) in production.
const backendUrl = import.meta.env.VITE_API_URL || '';

axios.defaults.baseURL = backendUrl;
axios.defaults.withCredentials = true;

// Remove StrictMode in production — it double-invokes effects & renders in dev,
// causing duplicate API calls during development. In production this has no effect,
// but removing it avoids confusion and keeps dev behavior predictable.
createRoot(document.getElementById('root')).render(<App />);
