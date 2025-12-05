import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Film, Users, BarChart3, Shield, TrendingUp, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({ films: 0, users: 0, published: 0 });

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== "admin") {
        window.location.href = createPageUrl("Browse");
        return;
      }
      setUser(currentUser);
      await loadStats();
      setLoading(false);
    } catch (error) {
      base44.auth.redirectToLogin(createPageUrl("AdminDashboard"));
    }
  };

  const loadStats = async () => {
    try {
      const films = await base44.entities.Film.list();
      const users = await base44.entities.User.list();
      const published = films.filter((f) => f.is_published).length;
      setStats({ films: films.length, users: users.length, published });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#EF6418]"></div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-[#000000] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-[#EF6418] to-[#D55514] rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-400">Welcome back, {user?.full_name || user?.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}>

            <Card className="bg-[#1A1A1A] border-[#333333]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-[#EF6418]" />
                  Total Films
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white">{stats.films}</div>
                <p className="text-sm text-gray-400 mt-1">{stats.published} published</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}>

            <Card className="bg-[#1A1A1A] border-[#333333]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#EF6418]" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white">{stats.users}</div>
                <p className="text-sm text-gray-400 mt-1">Registered accounts</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}>

            <Card className="bg-[#1A1A1A] border-[#333333]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#EF6418]" />
                  Publish Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white">
                  {stats.films > 0 ? Math.round(stats.published / stats.films * 100) : 0}%
                </div>
                <p className="text-sm text-gray-400 mt-1">Films published</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}>

          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-[#EF6418]/10 to-[#D55514]/10 border-[#EF6418]/20 hover:border-[#EF6418]/40 transition-colors cursor-pointer group">
              <Link to={createPageUrl("AdminFilms")}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3 group-hover:text-[#EF6418] transition-colors">
                    <div className="w-12 h-12 bg-[#EF6418]/20 rounded-lg flex items-center justify-center group-hover:bg-[#EF6418]/30 transition-colors">
                      <Film className="w-6 h-6 text-[#EF6418]" />
                    </div>
                    Manage Films
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Add, edit, or delete films from your catalog
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-700/10 border-purple-500/20 hover:border-purple-500/40 transition-colors cursor-pointer group">
              <Link to={createPageUrl("AdminUsers")}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3 group-hover:text-purple-400 transition-colors">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    View Users
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Browse and monitor user accounts
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-700/10 border-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer group">
              <Link to={createPageUrl("AdminAnalytics")}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3 group-hover:text-green-400 transition-colors">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                    View Analytics
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Track rentals and revenue performance
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-700/10 border-blue-500/20 hover:border-blue-500/40 transition-colors cursor-pointer group">
              <Link to={createPageUrl("AdminReviews")}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3 group-hover:text-blue-400 transition-colors">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                      <MessageSquare className="w-6 h-6 text-blue-400" />
                    </div>
                    Manage Reviews
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Moderate and manage film reviews
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>
            </div>
            </motion.div>

        {/* Back to Site */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center">

          <Link to={createPageUrl("Browse")}>
            <Button className="btn-secondary">
              Back to Browse
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>);

}