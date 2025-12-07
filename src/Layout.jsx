import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Film, Menu, X, LogOut, User, Shield, UserCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = React.useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const location = useLocation();

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
    setUser(null);
    window.location.href = createPageUrl("Landing");
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl("Browse"));
  };

  const isLandingPage = currentPageName === "Landing";

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {/* Custom Font & Base Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Albert+Sans:wght@300;400;500;600;700;800&display=swap');
        
        :root {
          /* Brand Colors */
          --color-primary: #EF6418;
          --color-primary-hover: #D55514;
          --color-primary-active: #C04A10;
          --color-secondary: #1A1A1A;
          --color-secondary-hover: #2A2A2A;
          --color-tertiary: #F4EDE5;
          --color-bg: #000000;
          --color-surface: #1F1F1F;
          --color-border: #333333;
          
          /* Text Colors */
          --color-text-primary: #FFFFFF;
          --color-text-muted: #B3B3B3;
          --color-text-on-primary: #FFFFFF;
          --color-text-on-secondary: #F4EDE5;
          --color-text-on-dark: #F4EDE5;
          
          /* Button Primary */
          --btn-primary-bg: #EF6418;
          --btn-primary-text: #FFFFFF;
          --btn-primary-hover-bg: #D55514;
          --btn-primary-active-bg: #C04A10;
          --btn-primary-disabled-bg: rgba(239, 100, 24, 0.5);
          --btn-primary-disabled-text: rgba(255, 255, 255, 0.6);
          
          /* Button Secondary */
          --btn-secondary-bg: #1A1A1A;
          --btn-secondary-text: #F4EDE5;
          --btn-secondary-border: #F4EDE5;
          --btn-secondary-hover-bg: #2A2A2A;
          
          /* Button Outline/Ghost */
          --btn-outline-border: #EF6418;
          --btn-outline-text: #EF6418;
          --btn-outline-hover-bg: rgba(239, 100, 24, 0.12);
          
          /* Focus States */
          --focus-ring-color: rgba(244, 237, 229, 0.6);
          --focus-ring-primary: rgba(239, 100, 24, 0.5);
        }
        
        * {
          font-family: 'Albert Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        body {
          background: var(--color-bg);
          overflow-x: hidden;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: var(--color-surface);
        }

        ::-webkit-scrollbar-thumb {
          background: var(--color-primary);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #D55514;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Global Button Styles */
        .btn-primary {
          background-color: var(--btn-primary-bg) !important;
          color: var(--btn-primary-text) !important;
          font-weight: 600;
          border: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(239, 100, 24, 0.25);
        }
        
        .btn-primary:hover:not(:disabled) {
          background-color: var(--btn-primary-hover-bg) !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(239, 100, 24, 0.35);
        }
        
        .btn-primary:active:not(:disabled) {
          background-color: var(--btn-primary-active-bg) !important;
          transform: translateY(0);
        }
        
        .btn-primary:disabled {
          background-color: var(--btn-primary-disabled-bg) !important;
          color: var(--btn-primary-disabled-text) !important;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        
        .btn-primary:focus-visible {
          outline: 2px solid var(--focus-ring-color);
          outline-offset: 2px;
        }

        .btn-secondary {
          background-color: var(--btn-secondary-bg) !important;
          color: var(--btn-secondary-text) !important;
          font-weight: 500;
          border: 1px solid var(--color-border) !important;
          transition: all 0.2s ease;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background-color: var(--btn-secondary-hover-bg) !important;
          border-color: var(--btn-secondary-text) !important;
        }
        
        .btn-secondary:focus-visible {
          outline: 2px solid var(--focus-ring-color);
          outline-offset: 2px;
        }

        .btn-outline {
          background-color: transparent !important;
          color: var(--btn-outline-text) !important;
          font-weight: 500;
          border: 1px solid var(--btn-outline-border) !important;
          transition: all 0.2s ease;
        }
        
        .btn-outline:hover:not(:disabled) {
          background-color: var(--btn-outline-hover-bg) !important;
        }
        
        .btn-outline:focus-visible {
          outline: 2px solid var(--focus-ring-primary);
          outline-offset: 2px;
        }

        .btn-ghost {
          background-color: transparent !important;
          color: var(--color-text-primary) !important;
          font-weight: 500;
          border: none;
          transition: all 0.2s ease;
        }
        
        .btn-ghost:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        
        .btn-ghost:focus-visible {
          outline: 2px solid var(--focus-ring-color);
          outline-offset: 2px;
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#1A1A1A] via-[#1A1A1A]/90 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to={createPageUrl("Browse")} className="flex items-center gap-3 group">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691721b89e14bc8b401725d6/6b060a1ae_ember-tv-logo.png"
                alt="Ember TV"
                className="h-10 sm:h-12 w-auto transform transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {!loading && (
                <>
                  {user ? (
                    <>
                      <Link
                        to={createPageUrl("Browse")}
                        className={`text-sm font-medium transition-colors hover:text-[#EF6418] ${
                          location.pathname === createPageUrl("Browse")
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      >
                        Browse
                      </Link>
                      <Link
                        to={createPageUrl("MyRentals")}
                        className={`text-sm font-medium transition-colors hover:text-[#EF6418] ${
                          location.pathname === createPageUrl("MyRentals")
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      >
                        My Rentals
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          to={createPageUrl("AdminDashboard")}
                          className={`text-sm font-medium transition-colors hover:text-[#EF6418] flex items-center gap-1 ${
                            location.pathname.includes("Admin")
                              ? "text-white"
                              : "text-gray-400"
                          }`}
                        >
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 hover:bg-white/10"
                          >
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-300">{user.email}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1A1A1A] border-[#333333] text-white">
                          <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                            <Link to={createPageUrl("Profile")} className="flex items-center gap-2">
                              <UserCircle className="w-4 h-4" />
                              My Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#333333]" />
                          <DropdownMenuItem
                            onClick={handleLogout}
                            className="focus:bg-white/10 focus:text-white cursor-pointer"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Log Out
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        onClick={handleLogin}
                        className="text-white hover:bg-white/10 font-medium"
                      >
                        Log In
                      </Button>
                      <Button
                        onClick={handleLogin}
                        className="btn-primary px-6"
                      >
                        Get Started
                      </Button>
                    </div>
                  )}
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1A1A1A]/95 backdrop-blur-lg border-t border-white/10">
            <div className="px-4 py-6 space-y-4">
              {!loading && (
                <>
                  {user ? (
                    <>
                      <Link
                        to={createPageUrl("Browse")}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-3 rounded-lg text-white font-medium hover:bg-white/10 transition-colors"
                      >
                        Browse
                      </Link>
                      <Link
                        to={createPageUrl("MyRentals")}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-3 rounded-lg text-white font-medium hover:bg-white/10 transition-colors"
                      >
                        My Rentals
                      </Link>
                      <Link
                        to={createPageUrl("Profile")}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 rounded-lg text-white font-medium hover:bg-white/10 transition-colors"
                      >
                        <UserCircle className="w-4 h-4" />
                        My Profile
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          to={createPageUrl("AdminDashboard")}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 rounded-lg text-white font-medium hover:bg-white/10 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      )}
                      <div className="px-4 py-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <User className="w-4 h-4" />
                          {user.email}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full px-4 py-3 rounded-lg text-white font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogin();
                        }}
                        className="btn-ghost w-full"
                      >
                        Log In
                      </Button>
                      <Button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogin();
                        }}
                        className="btn-primary w-full"
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16 sm:pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] border-t border-white/5 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link to={createPageUrl("Browse")} className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691721b89e14bc8b401725d6/6b060a1ae_ember-tv-logo.png"
                alt="Ember TV"
                className="h-8 w-auto"
              />
            </Link>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-4">
                <Link 
                  to={createPageUrl("PrivacyPolicy")}
                  className="text-gray-500 hover:text-[#EF6418] text-sm transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link 
                  to={createPageUrl("TermsOfService")}
                  className="text-gray-500 hover:text-[#EF6418] text-sm transition-colors"
                >
                  Terms of Service
                </Link>
              </div>
              <p className="text-gray-500 text-sm">
                © 2025 Ember VOD. Stream faith-focused films anytime.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}