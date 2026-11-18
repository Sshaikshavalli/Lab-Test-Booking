import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import Loader from '../components/common/Loader';
import NotFound from '../components/common/NotFound';
import Dashboard from '../features/dashboard/Dashboard';
import TestCatalogue from '../features/tests/TestCatalogue';
import RequireAuth from '../components/common/RequireAuth';

// Dashboard and catalogue load up front; every other page is split into its own chunk.
const BookingCart = lazy(() => import('../features/cart/BookingCart'));
const PatientDetails = lazy(() => import('../features/patient/PatientDetails'));
const SchedulePage = lazy(() => import('../features/schedule/SchedulePage'));
const BookingReview = lazy(() => import('../features/booking-review/BookingReview'));
const BookingConfirmation = lazy(() => import('../features/confirmation/BookingConfirmation'));
const MyBookings = lazy(() => import('../features/bookings/MyBookings'));
const BookingDetails = lazy(() => import('../features/bookings/BookingDetails'));
const AuthLayout = lazy(() => import('../features/auth/AuthLayout'));
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const SetupPage = lazy(() => import('../features/auth/SetupPage'));
const AccountPage = lazy(() => import('../features/account/AccountPage'));

const lazyPage = (el) => <Suspense fallback={<Loader label="Loading…" />}>{el}</Suspense>;
const guard = (el, opts) => <RequireAuth {...opts}>{lazyPage(el)}</RequireAuth>;

// Test details pulls in the 3D sample tube, so keep it out of the main bundle.
const TestDetails = lazy(() => import('../features/tests/TestDetails'));

export const router = createBrowserRouter([
  { element: lazyPage(<AuthLayout />), children: [{ path: '/login', element: <LoginPage /> }, { path: '/setup', element: <SetupPage /> }] },
  {
    element: <PageLayout />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/tests', element: <TestCatalogue /> },
      { path: '/tests/:testId', element: lazyPage(<TestDetails />) },
      { path: '/cart', element: guard(<BookingCart />) },
      { path: '/patient', element: guard(<PatientDetails />) },
      { path: '/schedule', element: guard(<SchedulePage />) },
      { path: '/review', element: guard(<BookingReview />) },
      { path: '/confirmation/:reference', element: guard(<BookingConfirmation />) },
      { path: '/bookings', element: guard(<MyBookings />) },
      { path: '/bookings/:id', element: guard(<BookingDetails />) },
      // Old link: the admin list now lives on the single Profile page.
      { path: '/admin/accounts', element: <Navigate to="/account" replace /> },
      { path: '/account', element: guard(<AccountPage />) },
      { path: '*', element: <NotFound /> },
    ],
  },
], { basename: import.meta.env.BASE_URL });
