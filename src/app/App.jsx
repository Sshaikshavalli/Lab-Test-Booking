import { RouterProvider } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { router } from './router';
import { CartProvider } from './providers/CartProvider';
import { AuthProvider } from './providers/AuthProvider';
import { LocationProvider } from './providers/LocationProvider';
import { ToastProvider } from '../components/common/Toast';

export default function App() {
  return (
    // reducedMotion="user" makes Framer Motion honour prefers-reduced-motion
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <RouterProvider router={router} />
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </ToastProvider>
    </MotionConfig>
  );
}
