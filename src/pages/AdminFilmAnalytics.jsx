import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
"@/components/ui/table";
import { format } from "date-fns";

export default function AdminFilmAnalytics() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [filmId, setFilmId] = React.useState(null);
  const location = useLocation();

  React.useEffect(() => {
    checkAuth();
    const urlParams = new URLSearchParams(location.search);
    setFilmId(urlParams.get("id"));
  }, [location]);

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
      base44.auth.redirectToLogin(createPageUrl("AdminFilmAnalytics"));
    }
  };

  const { data: film } = useQuery({
    queryKey: ['film-detail', filmId],
    queryFn: async () => {
      if (!filmId) return null;
      const films = await base44.entities.Film.filter({ id: filmId });
      return films[0] || null;
    },
    enabled: !!filmId
  });

  const { data: rentals, isLoading: rentalsLoading } = useQuery({
    queryKey: ['film-rentals', filmId],
    queryFn: async () => {
      if (!filmId) return [];
      const allRentals = await base44.entities.FilmRental.filter({
        film_id: filmId,
        status: ["active", "expired", "refunded"]
      }, '-purchased_at');
      return allRentals.filter((r) => r.status === 'active' || r.status === 'expired' || r.status === 'refunded');
    },
    enabled: !!filmId,
    initialData: []
  });

  const calculateMetrics = () => {
    // Exclude refunded rentals from counts and revenue
    const validRentals = rentals.filter(r => r.status !== 'refunded');

    const totalRentals = validRentals.length;
    const totalRevenue = validRentals.reduce((sum, r) => sum + (r.amount_cents || 0), 0);

    const firstRental = validRentals.length > 0 ?
    validRentals.reduce((earliest, r) => {
      const date = new Date(r.purchased_at);
      return !earliest || date < earliest ? date : earliest;
    }, null) :
    null;

    const latestRental = validRentals.length > 0 ?
    validRentals.reduce((latest, r) => {
      const date = new Date(r.purchased_at);
      return !latest || date > latest ? date : latest;
    }, null) :
    null;

    // Group by month
    const monthlyData = {};
    validRentals.forEach((rental) => {
      if (!rental.purchased_at) return;
      const date = new Date(rental.purchased_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          rentals: 0,
          revenue: 0
        };
      }

      monthlyData[monthKey].rentals++;
      monthlyData[monthKey].revenue += rental.amount_cents || 0;
    });

    const monthlyMetrics = Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));

    return {
      totalRentals,
      totalRevenue,
      firstRental,
      latestRental,
      monthlyMetrics
    };
  };

  const formatCurrency = (cents, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(cents / 100);
  };

  const formatMonthYear = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);
    return format(date, 'MMMM yyyy');
  };

  const exportCSV = () => {
    const metrics = calculateMetrics();
    const rows = [
    ['Month', 'Rentals', 'Net Revenue'],
    ...metrics.monthlyMetrics.map((m) => [
    formatMonthYear(m.month),
    m.rentals,
    formatCurrency(m.revenue)]
    )];


    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${film?.title || 'film'}_analytics.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#EF6418]"></div>
      </div>);

  }

  if (!film) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Film Not Found</h2>
          <Link to={createPageUrl("AdminAnalytics")}>
            <Button className="btn-primary">
              Back to Analytics
            </Button>
          </Link>
        </div>
      </div>);

  }

  const metrics = calculateMetrics();

  return (
    <div className="min-h-screen bg-[#000000] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>

          <Link to={createPageUrl("AdminAnalytics")}>
            <Button className="btn-ghost -ml-4 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analytics
            </Button>
          </Link>

          {/* Film Header */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {film.thumbnail_url &&
            <img
              src={film.thumbnail_url}
              alt={film.title}
              className="w-48 h-72 object-cover rounded-lg" />

            }
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{film.title}</h1>
              <p className="text-gray-400 mb-4">{film.short_description}</p>
              <div className="flex gap-3">
                <Button
                  onClick={exportCSV}
                  size="sm"
                  className="btn-secondary">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {rentalsLoading ?
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EF6418]"></div>
          </div> :

        <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}>

                <Card className="bg-[#1A1A1A] border-[#333333]">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-gray-400">Total Rentals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{metrics.totalRentals}</div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}>

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
              transition={{ duration: 0.6, delay: 0.3 }}>

                <Card className="bg-[#1A1A1A] border-[#333333]">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-gray-400">First Rental</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-medium text-white">
                      {metrics.firstRental ? format(metrics.firstRental, 'MMM d, yyyy') : 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}>

                <Card className="bg-[#1A1A1A] border-[#333333]">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-gray-400">Latest Rental</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-medium text-white">
                      {metrics.latestRental ? format(metrics.latestRental, 'MMM d, yyyy') : 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Monthly Breakdown */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}>

              <Card className="bg-[#1A1A1A] border-[#333333]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#EF6418]" />
                    Monthly Breakdown
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Rental and gross revenue data by month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics.monthlyMetrics.length === 0 ?
                <div className="text-center py-8">
                      <p className="text-gray-400">No rental data available</p>
                    </div> :

                <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#333333] hover:bg-transparent">
                            <TableHead className="text-gray-400">Month</TableHead>
                            <TableHead className="text-gray-400 text-right">Rentals</TableHead>
                            <TableHead className="text-gray-400 text-right">Gross Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {metrics.monthlyMetrics.map((metric) =>
                      <TableRow key={metric.month} className="border-[#333333] hover:bg-white/5">
                              <TableCell className="font-medium text-white">
                                {formatMonthYear(metric.month)}
                              </TableCell>
                              <TableCell className="text-right text-white">
                                {metric.rentals}
                              </TableCell>
                              <TableCell className="text-right text-[#EF6418] font-semibold">
                                {formatCurrency(metric.revenue)}
                              </TableCell>
                            </TableRow>
                      )}
                        </TableBody>
                      </Table>
                    </div>
                }
                </CardContent>
              </Card>
            </motion.div>
          </>
        }
      </div>
    </div>);

}