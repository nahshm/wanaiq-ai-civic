import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initWebVitals } from './lib/vitals'
import { initGlobalErrorHandling } from './lib/error-tracking'

// Initialize performance monitoring
initWebVitals();
initGlobalErrorHandling();

createRoot(document.getElementById("root")!).render(<App />);
