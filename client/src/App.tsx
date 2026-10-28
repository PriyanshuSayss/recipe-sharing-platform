import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import RecipeFormPage from './pages/RecipeFormPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyRecipesPage from './pages/MyRecipesPage';
import KitchenSearchPage from './pages/KitchenSearchPage';
import SavedRecipesPage from './pages/SavedRecipesPage';
import ShoppingListPage from './pages/ShoppingListPage';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { ShoppingProvider } from './features/shopping/ShoppingContext';
import { LoadingSpinner } from './components/States';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." className="min-h-[60vh]" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-amber-50/50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recipes/:slug" element={<RecipeDetailPage />} />
          <Route path="/kitchen-search" element={<KitchenSearchPage />} />
          <Route path="/shopping-list" element={<ShoppingListPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route
            path="/saved-recipes"
            element={
              <ProtectedRoute>
                <SavedRecipesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes/new"
            element={
              <ProtectedRoute>
                <RecipeFormPage mode="create" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes/:id/edit"
            element={
              <ProtectedRoute>
                <RecipeFormPage mode="edit" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-recipes"
            element={
              <ProtectedRoute>
                <MyRecipesPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      <footer className="border-t border-gray-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Plateful — Recipe Sharing & Serving-Size Scaling Platform.</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ShoppingProvider>
        <AppContent />
      </ShoppingProvider>
    </AuthProvider>
  );
}
