import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Dashboard } from "./pages/Dashboard";
import { GoogleCallback } from "./pages/GoogleCallback";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";

// Create routes using the new recommended approach
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      {/* Public Routes */}
      <Route index element={<Landing />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password/:token" element={<ResetPassword />} />
      <Route path="auth/google/callback" element={<GoogleCallback />} />
      
      {/* Protected Routes */}
      <Route path="dashboard">
        {/* Admin Dashboard */}
        <Route 
          path="admin" 
          element={
            <ProtectedRoute allowRoles={['admin']}>
              <Dashboard role="admin" />
            </ProtectedRoute>
          } 
        >
          <Route index element={null} />
          <Route path="users" element={<div>User Management</div>} />
          <Route path="analytics" element={<div>Analytics</div>} />
          <Route path="settings" element={<div>Settings</div>} />
        </Route>

        {/* Doctor Dashboard */}
        <Route 
          path="doctor" 
          element={
            <ProtectedRoute allowRoles={['doctor']}>
              <Dashboard role="doctor" />
            </ProtectedRoute>
          } 
        >
          <Route index element={null} />
          <Route path="patients" element={<div>My Patients</div>} />
          <Route path="appointments" element={<div>My Appointments</div>} />
        </Route>

        {/* Fallback for other roles */}
        <Route 
          path=":role/*" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Route>
  ),
  {
    future: {
      // Enable any v6.x future flags here
      v7_relativeSplatPath: true
    }
  }
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
