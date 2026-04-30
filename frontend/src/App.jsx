import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Feed from './components/Feed';
import VideoPlayer from './components/VideoPlayer';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Explore from './pages/Explore';
import FullView from './pages/FullView';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import History from './pages/History';
import Create from './pages/Create';
import Notifications from './pages/Notifications';
import Chatbot from './pages/Chatbot';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ChatbotButton from './components/ChatbotButton';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SocketProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Feed />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/explore" element={
                <ProtectedRoute>
                  <Layout>
                    <Explore />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/reels" element={
                <ProtectedRoute>
                  <FullView />
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <Layout>
                    <Messages />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/profile/:userId" element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Layout>
                    <Analytics />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <Layout>
                    <History />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/video" element={
                <ProtectedRoute>
                  <Layout>
                    <VideoPlayer />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/post/:postId" element={
                <ProtectedRoute>
                  <FullView />
                </ProtectedRoute>
              } />
              <Route path="/create" element={
                <ProtectedRoute>
                  <Layout>
                    <Create />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <Layout>
                    <Notifications />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/chatbot" element={
                <ProtectedRoute>
                  <Layout>
                    <Chatbot />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
            <ChatbotButton />
          </Router>
        </SocketProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
