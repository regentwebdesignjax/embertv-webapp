import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Calendar, Film as FilmIcon, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminAnalytics() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      setLoading(false);
    } catch (error) {
      base44.auth.redirectToLogin(createPageUrl("AdminAnalytics"));
    }
  };

  const { data: rentals, isLoading: rentalsLoading } = useQuery({
    queryKey: ['analytics-rentals'],
    queryFn: async () => {
      const allRentals = await base44.entities.FilmRental.filter({
        status: ["active", "expired"]
      }, '-purchased_at');
      return allRentals.filter(r => r.status === 'active' || r.status === 'expired');
    },
    initialData: [],
  });

  const { data: films } = useQuery({
    queryKey: ['analytics-films'],
    queryFn: () => base44.entities.Film.list(),
    initialData: [],
  });

  const calculateMetrics = () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const totalRentals = rentals.length;
    const totalRevenue = rentals.reduce((sum, r) => sum + (r.amount_cents || 0), 0);

    const currentMonthRentals = rentals.filter(r => {
      if (!r.purchased_at) return false;
      const rentalDate = new Date(r.purchased_at);
      const rentalMonth = `${rentalDate.getFullYear()}-${String(rentalDate.getMonth() + 1).padStart(2, '0')}`;
      return rentalMonth === currentMonth;
    });

    const monthlyRentals = currentMonthRentals.length;
    const monthlyRevenue = currentMonthRentals.reduce((sum, r) => sum + (r.amount_cents || 0), 0);

    // Calculate per-film metrics
    const filmMetrics = films.map(film => {
      const filmRentals = rentals.filter(r => r.film_id === film.id);
      const filmMonthlyRentals = currentMonthRentals.filter(r => r.film_id === film.id);

      return {
        film,
        totalRentals: filmRentals.length,
        totalRevenue: filmRentals.reduce((sum, r) => sum + (r.amount_cents || 0), 0),
        monthlyRentals: filmMonthlyRentals.length,
        monthlyRevenue: filmMonthlyRentals.reduce((sum, r) => sum + (r.amount_cents || 0), 0),
      };
    }).filter(m => m.totalRentals > 0);

    // Sort by total rentals descending
    filmMetrics.sort((a, b) => b.totalRentals - a.totalRentals);

    return {
      totalRentals,
      totalRevenue,
      monthlyRentals,
      monthlyRevenue,
      currentMonth,
      filmMetrics,
    };
  };

  const formatCurrency = (cents, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(cents / 100);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await base44.functions.invoke('syncStripeRentals', {});
      
      if (response.data.success) {
        toast({
          title: "Sync Complete",
          description: `${response.data.synced} rentals updated, ${response.data.skipped} skipped`,
        });
        queryClient.invalidateQueries({ queryKey: ['analytics-rentals'] });
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#EF6418]"></div>
      </div>
    );
  }

  const metrics = calculateMetrics();

  return (
    <div className="min-h-screen bg-[#000000] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link to={createPageUrl("AdminDashboard")}>
            <Button className="btn-ghost -ml-4 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#EF6418] to-[#D55514] rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Rental Analytics</h1>
                <p className="text-gray-400">Track performance and gross revenue metrics</p>
              </div>
            </div>
            <Button
              onClick={handleSync}
              disabled={syncing}
              className="btn-primary"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync from Stripe'}
            </Button>
          </div>
        </motion.div>

        {rentalsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EF6418]"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="bg-[#1A1A1A] border-[#333333]">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-gray-400">Total Rentals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{metrics.totalRentals}</div>
                    <p className="text-xs text-gray-500 mt-1">All time</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-[#1A1A1A] border-[#333333]">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-gray-400">Gross Revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[#EF6418]">
                      {formatCurrency(metrics.totalRevenue)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">All time</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-[#1A1A1A] border-[#333333]">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      This Month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{metrics.monthlyRentals}</div>
                    <p className="text-xs text-gray-500 mt-1">Rentals</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="bg-[#1A1A1A] border-[#333333]">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      This Month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[#EF6418]">
                      {formatCurrency(metrics.monthlyRevenue)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Gross Revenue</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Film Performance Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="bg-[#1A1A1A] border-[#333333]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FilmIcon className="w-5 h-5 text-[#EF6418]" />
                    Film Performance
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Gross revenue and rental metrics by film
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics.filmMetrics.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No rental data available yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#333333] hover:bg-transparent">
                            <TableHead className="text-gray-400">Film</TableHead>
                            <TableHead className="text-gray-400 text-right">Total Rentals</TableHead>
                            <TableHead className="text-gray-400 text-right">Gross Revenue</TableHead>
                            <TableHead className="text-gray-400 text-right">This Month</TableHead>
                            <TableHead className="text-gray-400 text-right">Monthly Gross</TableHead>
                            <TableHead className="text-gray-400 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {metrics.filmMetrics.map((metric) => (
                            <TableRow key={metric.film.id} className="border-[#333333] hover:bg-white/5">
                              <TableCell className="font-medium text-white">
                                <div className="flex items-center gap-3">
                                  {metric.film.thumbnail_url && (
                                    <img
                                      src={metric.film.thumbnail_url}
                                      alt={metric.film.title}
                                      className="w-12 h-16 object-cover rounded"
                                    />
                                  )}
                                  <span>{metric.film.title}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-white">
                                {metric.totalRentals}
                              </TableCell>
                              <TableCell className="text-right text-[#EF6418] font-semibold">
                                {formatCurrency(metric.totalRevenue)}
                              </TableCell>
                              <TableCell className="text-right text-gray-300">
                                {metric.monthlyRentals}
                              </TableCell>
                              <TableCell className="text-right text-gray-300">
                                {formatCurrency(metric.monthlyRevenue)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Link to={createPageUrl(`AdminFilmAnalytics?id=${metric.film.id}`)}>
                                  <Button
                                    size="sm"
                                    className="btn-outline"
                                  >
                                    View Details
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}