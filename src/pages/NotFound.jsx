import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="p-6 bg-primary/10 text-primary border border-primary/20 rounded-3xl"
      >
        <AlertTriangle className="w-16 h-16 animate-pulse" />
      </motion.div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-4xl font-extrabold tracking-tight">404 - Page Not Found</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The page you are looking for does not exist, has been deleted, or has moved to another address.
        </p>
      </div>

      <Link
        to="/"
        className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity"
      >
        <Home className="w-4.5 h-4.5" />
        <span>Return Dashboard</span>
      </Link>
    </div>
  );
}
