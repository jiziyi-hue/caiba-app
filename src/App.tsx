import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './lib/auth';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { IssueDetailScreen } from './screens/IssueDetailScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ProfileEditScreen } from './screens/ProfileEditScreen';
import { SettlementScreen } from './screens/SettlementScreen';
import { SquareScreen } from './screens/SquareScreen';
import { TopicScreen } from './screens/TopicScreen';
import { PostScreen } from './screens/PostScreen';
import { ComposeScreen } from './screens/ComposeScreen';
import { AdminSettlementScreen } from './screens/AdminSettlementScreen';
import { AdminModerationScreen } from './screens/AdminModerationScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />

          {/* Public read-only routes — anonymous users can browse */}
          <Route path="/" element={<HomeScreen />} />
          <Route path="/issue/:id" element={<IssueDetailScreen />} />
          <Route path="/square" element={<SquareScreen />} />
          <Route path="/topic/:id" element={<TopicScreen />} />
          <Route path="/post/:id" element={<PostScreen />} />
          <Route path="/u/:handle" element={<ProfileScreen />} />
          <Route path="/share/:judgmentId" element={<SettlementScreen />} />

          {/* Auth-required routes — write or own-self actions */}
          <Route element={<RequireAuth />}>
            <Route path="/me" element={<ProfileScreen />} />
            <Route path="/me/edit" element={<ProfileEditScreen />} />
            <Route path="/compose" element={<ComposeScreen />} />
            <Route path="/notifications" element={<NotificationsScreen />} />
          </Route>
          <Route element={<RequireAuth requireAdmin />}>
            <Route path="/admin/settle" element={<AdminSettlementScreen />} />
            <Route path="/admin/moderation" element={<AdminModerationScreen />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
