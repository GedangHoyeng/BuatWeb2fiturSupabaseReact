// Patch for React 19 + framer-motion removeChild conflict
// Prevents NotFoundError during route navigation
const origRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function (child) {
  try {
    return origRemoveChild.call(this, child);
  } catch (e) {
    if (e.name === 'NotFoundError') return child;
    throw e;
  }
};

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<App />)
