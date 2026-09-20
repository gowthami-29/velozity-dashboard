
import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";

import DashboardLayout from "./layouts/DashboardLayout";

import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import TasksPage from "./pages/TasksPage";
import ActivityPage from "./pages/ActivityPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";

import { getStoredUser } from "./services/api";

import { SocketProvider } from "./context/SocketContext";

interface User {
  id: string;
  name: string;
  email: string;
  role:
    | "ADMIN"
    | "PROJECT_MANAGER"
    | "DEVELOPER";
}

function App() {
  const [user, setUser] = useState<User | null>(
    getStoredUser()
  );

  const [showRegister, setShowRegister] =
    useState(false);

  const handleLogout = () => {
    setUser(null);
  };

  /*
   * Authentication screens
   */
  if (!user) {
    if (showRegister) {
      return (
        <Register
          onRegistered={() => setShowRegister(false)}
          onBackToLogin={() => setShowRegister(false)}
        />
      );
    }

    return (
      <Login
        onLogin={(loggedInUser) =>
          setUser(loggedInUser)
        }
        onRegister={() => setShowRegister(true)}
      />
    );
  }

  /*
   * Authenticated application
   */
  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>

          {/* =========================================
              Main authenticated layout
          ========================================= */}
          <Route
            element={
              <DashboardLayout
                user={user}
                onLogout={handleLogout}
              />
            }
          >

            {/* =========================================
                Default route
            ========================================= */}
            <Route
              path="/"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

            {/* =========================================
                Dashboard
            ========================================= */}
            <Route
              path="/dashboard"
              element={
                <DashboardPage user={user} />
              }
            />

            {/* =========================================
                Projects
            ========================================= */}
            <Route
              path="/projects"
              element={
                <ProjectsPage user={user} />
              }
            />

            {/* =========================================
                Project Details
            ========================================= */}
            <Route
              path="/projects/:projectId"
              element={
                <ProjectDetailsPage user={user} />
              }
            />

            {/* =========================================
                Tasks
            ========================================= */}
            <Route
              path="/tasks"
              element={
                <TasksPage user={user} />
              }
            />

            {/* =========================================
                Activity
            ========================================= */}
            <Route
              path="/activity"
              element={
                <ActivityPage user={user} />
              }
            />

            {/* =========================================
                Users
                Admin only
            ========================================= */}
            <Route
              path="/users"
              element={
                user.role === "ADMIN" ? (
                  <UsersPage user={user} />
                ) : (
                  <Navigate
                    to="/dashboard"
                    replace
                  />
                )
              }
            />

            {/* =========================================
                Settings
                Admin only
            ========================================= */}
            <Route
              path="/settings"
              element={
                user.role === "ADMIN" ? (
                  <SettingsPage user={user} />
                ) : (
                  <Navigate
                    to="/dashboard"
                    replace
                  />
                )
              }
            />

          </Route>

          {/* =========================================
              Unknown route
          ========================================= */}
          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;

