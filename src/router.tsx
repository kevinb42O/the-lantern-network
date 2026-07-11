import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './App';
import { SplashScreen } from '@/components/screens/splash-screen';
import { AuthScreen } from '@/components/screens/auth-screen';
import { ProfileSetup } from '@/components/screens/profile-setup';
import { FlaresView } from '@/components/screens/flares-view';
import { CampfireView } from '@/components/screens/campfire-view';
import { WalletView } from '@/components/screens/wallet-view';
import { ProfileView } from '@/components/screens/profile-view';
import { MessagesView } from '@/components/screens/messages-view';
import { UsefulNumbersView } from '@/components/screens/useful-numbers-view';
import { AdminView } from '@/components/screens/admin-view';
import { ModeratorView } from '@/components/screens/moderator-view';
import { StatisticsView } from '@/components/screens/statistics-view';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <FlaresView /> },
      { path: 'campfire', element: <CampfireView /> },
      { path: 'wallet', element: <WalletView /> },
      { path: 'messages', element: <MessagesView /> },
      { path: 'numbers', element: <UsefulNumbersView /> },
      { path: 'profile', element: <ProfileView /> },
      { path: 'admin', element: <AdminView /> },
      { path: 'moderator', element: <ModeratorView /> },
    ],
  },
  { path: '/stats', element: <StatisticsView isAdmin={true} /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
