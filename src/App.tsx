import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, Navigate } from 'react-router-dom';
import { Users, DollarSign, Link as LinkIcon, Menu, LogOut, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import InvitedUsers from './components/InvitedUsers';
import Auth from './components/Auth';
import Settings from './components/Settings';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
}

function NavLink({ to, children }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`${
        isActive
          ? 'border-indigo-500 text-gray-900'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
    >
      {children}
    </Link>
  );
}

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log('App component mounted');
    // Check if user is authenticated (e.g., by checking for a token in localStorage)
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  console.log('Rendering App component, isAuthenticated:', isAuthenticated);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-lg sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <LinkIcon className="h-8 w-8 text-indigo-600" />
                  <span className="ml-2 text-xl font-bold text-gray-800">ToshiRef</span>
                </div>
                {isAuthenticated && (
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <NavLink to="/dashboard">Dashboard</NavLink>
                    <NavLink to="/invited-users">Invited Users</NavLink>
                    <NavLink to="/settings">Settings</NavLink>
                  </div>
                )}
              </div>
              <div className="flex items-center">
                {isAuthenticated && (
                  <div className="flex items-center">
                    <div className="relative">
                      <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        id="user-menu"
                        aria-expanded="false"
                        aria-haspopup="true"
                      >
                        <span className="sr-only">Open user menu</span>
                        <Menu className="h-6 w-6 text-gray-400" />
                      </button>
                      {isMenuOpen && (
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
                          <button
                            onClick={handleLogout}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            role="menuitem"
                          >
                            <LogOut className="h-4 w-4 inline-block mr-2" />
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu, show/hide based on menu state */}
          <div className={`sm:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
            <div className="pt-2 pb-3 space-y-1">
              {isAuthenticated && (
                <>
                  <NavLink to="/dashboard">Dashboard</NavLink>
                  <NavLink to="/invited-users">Invited Users</NavLink>
                  <NavLink to="/settings">Settings</NavLink>
                </>
              )}
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Auth setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
            <Route path="/invited-users" element={isAuthenticated ? <InvitedUsers /> : <Navigate to="/" />} />
            <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
