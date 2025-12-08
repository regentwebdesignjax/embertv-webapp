import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, Mail, Save, CreditCard, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { X } from "lucide-react";

export default function Profile() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [fullName, setFullName] = React.useState("");
  const [saveMessage, setSaveMessage] = React.useState(null);
  const [portalLoading, setPortalLoading] = React.useState(false);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFullName(currentUser.full_name || "");
      setLoading(false);
    } catch (error) {
      base44.auth.redirectToLogin(createPageUrl("Profile"));
    }
  };

  const { data: rentals } = useQuery({
    queryKey: ['user-rentals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const allRentals = await base44.entities.FilmRental.filter({ user_id: user.id }, '-created_date');

      const rentalsWithFilms = await Promise.all(
        allRentals.map(async (rental) => {
          const films = await base44.entities.Film.filter({ id: rental.film_id });
          return { ...rental, film: films[0] };
        })
      );

      return rentalsWithFilms;
    },
    enabled: !!user,
    initialData: []
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.auth.updateMe(data);
    },
    onSuccess: async () => {
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      setFullName(updatedUser.full_name || "");
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    },
    onError: (error) => {
      setSaveMessage({ type: 'error', text: error.message || 'Failed to update profile' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  });

  const handleSave = () => {
    updateProfileMutation.mutate({ full_name: fullName });
  };

  const handleManagePayments = async () => {
    setPortalLoading(true);
    try {
      const response = await base44.functions.invoke('createCustomerPortal');
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to open payment portal' });
      setTimeout(() => setSaveMessage(null), 3000);
      setPortalLoading(false);
    }
  };

  const activeRentals = rentals.filter((r) => r.status === 'active');
  const expiredRentals = rentals.filter((r) => r.status === 'expired');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#EF6418]"></div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-[#000000] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>

          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <p className="text-gray-400 mb-8">Manage your account settings and preferences</p>
        </motion.div>

        {saveMessage &&
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6">

            <Alert className={`relative ${saveMessage.type === 'success' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <AlertDescription className={saveMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                {saveMessage.text}
              </AlertDescription>
              <button
                onClick={() => setSaveMessage(null)}
                className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </Alert>
          </motion.div>
        }

        <div className="grid gap-6">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}>

            <Card className="bg-[#1A1A1A] border-[#333333]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-[#EF6418]" />
                  Personal Information
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Update your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-white mb-2 block">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-[#0A0A0A] border-[#333333] text-white focus:border-[#EF6418] focus:ring-[#EF6418]"
                    placeholder="Enter your full name" />

                </div>

                <div>
                  <Label htmlFor="email" className="text-white mb-2 block">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="bg-[#0A0A0A] border-[#333333] text-gray-400 pl-10 cursor-not-allowed" />

                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {user.role === 'admin' &&
                <div>
                    <Label className="text-white mb-2 block">Role</Label>
                    <Badge className="bg-[#EF6418]/20 text-[#EF6418] border-[#EF6418]/30">
                      Administrator
                    </Badge>
                  </div>
                }

                <Button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending || !fullName.trim()}
                  className="btn-primary w-full sm:w-auto">

                  {updateProfileMutation.isPending ?
                  <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </> :

                  <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  }
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Methods */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}>

            <Card className="bg-[#1A1A1A] border-[#333333]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#EF6418]" />
                  Payment Methods
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your payment methods and billing information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleManagePayments}
                  disabled={portalLoading}
                  className="btn-secondary">


                  {portalLoading ?
                  <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opening Portal...
                    </> :

                  <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage Payment Methods
                    </>
                  }
                </Button>
                <p className="text-xs text-gray-500 mt-3">
                  You'll be redirected to a secure Stripe portal to manage your payment methods
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Rental History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}>

            <Card className="bg-[#1A1A1A] border-[#333333]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-[#EF6418]" />
                  Rental History
                </CardTitle>
                <CardDescription className="text-gray-400">
                  View all your past and current film rentals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rentals.length === 0 ?
                <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No rental history yet</p>
                    <Link to={createPageUrl("Browse")}>
                      <Button className="btn-primary">
                        Browse Films
                      </Button>
                    </Link>
                  </div> :

                <div className="space-y-6">
                    {activeRentals.length > 0 &&
                  <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Active Rentals</h3>
                        <div className="space-y-3">
                          {activeRentals.map((rental) =>
                      <div
                        key={rental.id}
                        className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-[#EF6418]/20">

                              <div className="flex items-center gap-3">
                                {rental.film?.thumbnail_url &&
                          <img
                            src={rental.film.thumbnail_url}
                            alt={rental.film.title}
                            className="w-16 h-24 object-cover rounded" />

                          }
                                <div>
                                  <h4 className="font-medium text-white">{rental.film?.title || 'Unknown Film'}</h4>
                                  <p className="text-sm text-gray-400">
                                    Expires: {format(new Date(rental.expires_at), 'MMM d, yyyy h:mm a')}
                                  </p>
                                  <Badge className="mt-1 bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                    Active
                                  </Badge>
                                </div>
                              </div>
                              <Link to={createPageUrl(`FilmDetail?slug=${rental.film?.slug}`)}>
                                <Button size="sm" className="btn-primary">
                                  Watch Now
                                </Button>
                              </Link>
                            </div>
                      )}
                        </div>
                      </div>
                  }

                    {expiredRentals.length > 0 &&
                  <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Past Rentals</h3>
                        <div className="space-y-3">
                          {expiredRentals.slice(0, 5).map((rental) =>
                      <div
                        key={rental.id}
                        className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-[#333333]">

                              <div className="flex items-center gap-3">
                                {rental.film?.thumbnail_url &&
                          <img
                            src={rental.film.thumbnail_url}
                            alt={rental.film.title}
                            className="w-16 h-24 object-cover rounded opacity-60" />

                          }
                                <div>
                                  <h4 className="font-medium text-gray-300">{rental.film?.title || 'Unknown Film'}</h4>
                                  <p className="text-sm text-gray-500">
                                    Rented: {format(new Date(rental.purchased_at || rental.created_date), 'MMM d, yyyy')}
                                  </p>
                                  <Badge className="mt-1 bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                                    Expired
                                  </Badge>
                                </div>
                              </div>
                              <Link to={createPageUrl(`FilmDetail?slug=${rental.film?.slug}`)}>
                                <Button size="sm" className="btn-outline">
                                  Rent Again
                                </Button>
                              </Link>
                            </div>
                      )}
                        </div>
                      </div>
                  }
                  </div>
                }
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>);

}