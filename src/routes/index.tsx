import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { AuthLayout } from '../components/layout/AuthLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { OnboardingPage } from '../pages/auth/OnboardingPage';
import { GroupFeedPage } from '../pages/groups/GroupFeedPage';
import { GroupDetailPage } from '../pages/groups/GroupDetailPage';
import { GroupChatPage } from '../pages/groups/GroupChatPage';
import { CreateGroupPage } from '../pages/groups/CreateGroupPage';
import { FriendsPage } from '../pages/friends/FriendsPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { DirectMessagePage } from '../pages/messages/DirectMessagePage';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminModerationPage } from '../pages/admin/AdminModerationPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    ),
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <GroupFeedPage /> },
          { path: 'groups/new', element: <CreateGroupPage /> },
          { path: 'groups/:id', element: <GroupDetailPage /> },
          { path: 'groups/:id/chat', element: <GroupChatPage /> },
          { path: 'friends', element: <FriendsPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'messages/:userId', element: <DirectMessagePage /> },
        ],
      },
      {
        path: 'onboarding',
        element: (
          <AuthLayout>
            <OnboardingPage />
          </AuthLayout>
        ),
      },
    ],
  },
  {
    path: '/admin',
    children: [
      {
        path: 'login',
        element: (
          <AuthLayout>
            <AdminLoginPage />
          </AuthLayout>
        ),
      },
      {
        element: <AdminRoute />,
        children: [
          {
            element: <AppLayout isAdmin />,
            children: [
              { index: true, element: <AdminDashboardPage /> },
              { path: 'users', element: <AdminUsersPage /> },
              { path: 'moderation', element: <AdminModerationPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
