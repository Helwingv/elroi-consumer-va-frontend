import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';
import Notifications from '../pages/Notifications';
import Providers from '../pages/Providers';
import Marketplace from '../pages/Marketplace';
import Consent from '../pages/Consent';
import DataElements from '../pages/DataElements';
import HealthRecords from '../pages/HealthRecords';
import CarePlanner from '../pages/CarePlanner';
import Settings from '../pages/Settings';
import Login from '../pages/Login';
import TwoFactorVerification from '../pages/TwoFactorVerification';
import { useAuth } from '../hooks/useAuth';
import { AuthProvider } from '../hooks/useAuth';
import { SidebarProvider } from '../hooks/useSidebar';
import { SupabaseAuthProvider, useSupabaseAuth } from '../hooks/useSupabaseAuth';

function ProtectedRoute() {
  const { user: legacyUser, loading: legacyLoading } = useAuth();
  const { user: supabaseUser, loading: supabaseLoading } = useSupabaseAuth();

  // Show nothing while checking auth status
  if (legacyLoading || supabaseLoading) {
    return <div className="flex h-screen items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  // Redirect to login if not authenticated with Supabase
  if (!supabaseUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function PublicRoute() {
  const { user: legacyUser, loading: legacyLoading } = useAuth();
  const { user: supabaseUser, loading: supabaseLoading } = useSupabaseAuth();

  // Show nothing while checking auth status
  if (legacyLoading || supabaseLoading) {
    return <div className="flex h-screen items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  // Redirect to dashboard if already authenticated with Supabase
  if (supabaseUser) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <SupabaseAuthProvider>
          <Outlet />
        </SupabaseAuthProvider>
      </AuthProvider>
    ),
    children: [
      // Public routes (login, register, etc)
      {
        element: <PublicRoute />,
        children: [
          {
            path: '/login',
            element: <Login />
          },
          {
            path: '/two-factor',
            element: <TwoFactorVerification />
          }
        ]
      },

      // Protected routes (require authentication)
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: (
              <SidebarProvider>
                <MainLayout>
                  <Outlet />
                </MainLayout>
              </SidebarProvider>
            ),
            children: [
              {
                path: '/',
                element: <Dashboard />
              },
              {
                path: '/notifications',
                element: <Notifications />
              },
              {
                path: '/providers',
                element: <Providers />
              },
              {
                path: '/marketplace',
                element: <Marketplace />
              },
              {
                path: '/consent',
                element: <Consent />
              },
              {
                path: '/data-elements',
                element: <DataElements />
              },
              {
                path: '/care-planner',
                element: <CarePlanner />
              },
              {
                path: '/health-records',
                element: <HealthRecords />
              },
              {
                path: '/settings',
                element: <Settings />
              }
            ]
          }
        ]
      },

      // Catch all route - redirect to login
      {
        path: '*',
        element: <Navigate to="/login" replace />
      }
    ]
  }
]);