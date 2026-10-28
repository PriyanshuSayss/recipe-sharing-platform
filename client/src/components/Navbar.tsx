import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, Search, PlusCircle, BookOpen, LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-forest">
            <ChefHat className="w-7 h-7 text-coral" />
            Plateful
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-forest transition-colors text-sm font-medium">
              Browse
            </Link>
            <Link to="/kitchen-search" className="text-gray-600 hover:text-forest transition-colors text-sm font-medium flex items-center gap-1">
              <Search className="w-4 h-4" />
              Kitchen Search
            </Link>
            {user && (
              <>
                <Link to="/my-recipes" className="text-gray-600 hover:text-forest transition-colors text-sm font-medium flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  My Recipes
                </Link>
                <Link to="/recipes/new" className="btn-primary flex items-center gap-1 text-sm py-2 px-4">
                  <PlusCircle className="w-4 h-4" />
                  New Recipe
                </Link>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm text-gray-500">{user.displayName}</span>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
            {!user && (
              <>
                <Link to="/login" className="text-gray-600 hover:text-forest transition-colors text-sm font-medium">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                  Join Free
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-forest"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3">
          <Link to="/" onClick={() => setMenuOpen(false)} className="text-gray-700 hover:text-forest py-1 text-sm font-medium">Browse Recipes</Link>
          <Link to="/kitchen-search" onClick={() => setMenuOpen(false)} className="text-gray-700 hover:text-forest py-1 text-sm font-medium">Kitchen Search</Link>
          {user ? (
            <>
              <Link to="/my-recipes" onClick={() => setMenuOpen(false)} className="text-gray-700 hover:text-forest py-1 text-sm font-medium">My Recipes</Link>
              <Link to="/recipes/new" onClick={() => setMenuOpen(false)} className="text-gray-700 hover:text-forest py-1 text-sm font-medium">New Recipe</Link>
              <hr className="border-gray-100" />
              <span className="text-gray-400 text-sm">{user.displayName}</span>
              <button onClick={handleLogout} className="text-left text-red-600 text-sm font-medium py-1">Log Out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-gray-700 hover:text-forest py-1 text-sm font-medium">Sign In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-sm py-2 text-center">Join Free</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
