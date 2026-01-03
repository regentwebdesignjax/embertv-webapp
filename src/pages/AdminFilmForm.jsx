import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Film } from "lucide-react"; // Added Film icon
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card"; // Removed CardHeader, CardDescription, CardTitle as they are replaced by h2
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminFilmForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [filmId, setFilmId] = React.useState(null);
  const [syncMessage, setSyncMessage] = React.useState(null);
  const [syncing, setSyncing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: "",
    slug: "",
    short_description: "",
    long_description: "",
    thumbnail_url: "",
    banner_image_url: "",
    duration_minutes: "",
    release_year: "",
    genre: "",
    rating: "",
    is_published: false,
    is_featured: false,
    is_new_release: false,
    is_trending: false,
    is_leaving_soon: false,
    stripe_product_id: "",
    stripe_price_id: "",
    rental_price_cents: "",
    rental_currency: "usd",
    trailer_embed_code: "",
    full_movie_embed_code: "",
    hls_playback_url: ""
  });

  React.useEffect(() => {
    checkAuth();
    const urlParams = new URLSearchParams(location.search);
    const id = urlParams.get("id");
    if (id) {
      setFilmId(id);
    }
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
      base44.auth.redirectToLogin(createPageUrl("AdminFilms"));
    }
  };

  const { data: film } = useQuery({
    queryKey: ['film', filmId],
    queryFn: async () => {
      const films = await base44.entities.Film.filter({ id: filmId });
      return films[0];
    },
    enabled: !!filmId
  });

  React.useEffect(() => {
    if (film) {
      setFormData({
        title: film.title || "",
        slug: film.slug || "",
        short_description: film.short_description || "",
        long_description: film.long_description || "",
        thumbnail_url: film.thumbnail_url || "",
        banner_image_url: film.banner_image_url || "",
        duration_minutes: film.duration_minutes || "",
        release_year: film.release_year || "",
        genre: film.genre || "",
        rating: film.rating || "",
        is_published: film.is_published || false,
        is_featured: film.is_featured || false,
        is_new_release: film.is_new_release || false,
        is_trending: film.is_trending || false,
        is_leaving_soon: film.is_leaving_soon || false,
        stripe_product_id: film.stripe_product_id || "",
        stripe_price_id: film.stripe_price_id || "",
        rental_price_cents: film.rental_price_cents || "",
        rental_currency: film.rental_currency || "usd",
        trailer_embed_code: film.trailer_embed_code || "",
        full_movie_embed_code: film.full_movie_embed_code || "",
        hls_playback_url: film.hls_playback_url || ""
      });
    }
  }, [film]);

  const createFilmMutation = useMutation({
    mutationFn: (data) => base44.entities.Film.create(data),
    onSuccess: () => {
      navigate(createPageUrl("AdminFilms"));
    }
  });

  const updateFilmMutation = useMutation({
    mutationFn: (data) => base44.entities.Film.update(filmId, data),
    onSuccess: () => {
      navigate(createPageUrl("AdminFilms"));
    }
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from title
    if (field === "title" && !filmId) {
      const slug = value.
      toLowerCase().
      replace(/[^a-z0-9]+/g, "-").
      replace(/^-+|-+$/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSyncStripePrice = async () => {
    if (!formData.stripe_product_id) {
      setSyncMessage({ type: 'error', text: 'Please enter a Stripe Product ID first' });
      return;
    }

    setSyncing(true);
    setSyncMessage(null);

    try {
      const response = await base44.functions.invoke('syncStripePrice', {
        stripe_product_id: formData.stripe_product_id,
        film_id: filmId
      });

      if (response.data.success) {
        setFormData((prev) => ({
          ...prev,
          stripe_price_id: response.data.price_data.stripe_price_id,
          rental_price_cents: response.data.price_data.rental_price_cents,
          rental_currency: response.data.price_data.rental_currency
        }));
        setSyncMessage({
          type: 'success',
          text: `Successfully synced price: ${response.data.price_data.formatted_price}`
        });
      }
    } catch (error) {
      setSyncMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to sync price from Stripe'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      release_year: formData.release_year ? parseInt(formData.release_year) : null,
      rental_price_cents: formData.rental_price_cents ? parseInt(formData.rental_price_cents) : null
    };

    // Auto-sync price on save if stripe_product_id is provided
    if (submitData.stripe_product_id && (
    !filmId || film?.stripe_product_id !== submitData.stripe_product_id)) {
      setSyncing(true);
      try {
        const response = await base44.functions.invoke('syncStripePrice', {
          stripe_product_id: submitData.stripe_product_id,
          film_id: filmId
        });

        if (response.data.success) {
          submitData.stripe_price_id = response.data.price_data.stripe_price_id;
          submitData.rental_price_cents = response.data.price_data.rental_price_cents;
          submitData.rental_currency = response.data.price_data.rental_currency;
        }
      } catch (error) {
        setSyncMessage({
          type: 'error',
          text: error.response?.data?.error || 'Failed to sync price from Stripe. Please sync manually before saving.'
        });
        setSyncing(false);
        return;
      }
      setSyncing(false);
    }

    if (filmId) {
      updateFilmMutation.mutate(submitData);
    } else {
      createFilmMutation.mutate(submitData);
    }
  };

  const formatPrice = (cents, currency) => {
    if (!cents) return 'Not set';
    return `$${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  };

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

          <Link to={createPageUrl("AdminFilms")}>
            <Button className="btn-ghost -ml-4 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Films
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-8">
            {filmId ? "Edit Film" : "Add New Film"}
          </h1>
        </motion.div>

        {syncMessage &&
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}>

            <Alert className={`mb-6 ${
          syncMessage.type === 'success' ?
          'bg-green-500/10 border-green-500/30 text-green-400' :
          'bg-red-500/10 border-red-500/30 text-red-400'}`
          }>
              <AlertDescription>{syncMessage.text}</AlertDescription>
            </Alert>
          </motion.div>
        }

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}>

          <Card className="bg-[#1A1A1A] border-[#333333]">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Film className="w-5 h-5 text-[#EF6418]" />
                    Basic Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-white">Title *</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        required
                        className="bg-[#1F1F1F] border-[#333333] text-white focus:border-[#EF6418] focus:ring-[#EF6418]" />

                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug" className="text-white">Slug *</Label>
                      <Input
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={(e) => handleInputChange("slug", e.target.value)}
                        required
                        className="bg-[#1F1F1F] border-[#333333] text-white font-mono focus:border-[#EF6418] focus:ring-[#EF6418]" />

                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="short_description" className="text-white">Short Description</Label>
                    <Textarea
                      id="short_description"
                      name="short_description"
                      value={formData.short_description}
                      onChange={(e) => handleInputChange("short_description", e.target.value)}
                      rows={3}
                      className="bg-[#1F1F1F] border-[#333333] text-white focus:border-[#EF6418] focus:ring-[#EF6418]"
                      placeholder="Brief description for film cards..." />

                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="long_description" className="text-white">Long Description</Label>
                    <Textarea
                      id="long_description"
                      name="long_description"
                      value={formData.long_description}
                      onChange={(e) => handleInputChange("long_description", e.target.value)}
                      rows={6}
                      className="bg-[#1F1F1F] border-[#333333] text-white focus:border-[#EF6418] focus:ring-[#EF6418]"
                      placeholder="Detailed description for film detail page..." />

                  </div>
                </div>

                {/* Media & Metadata */}
                <div className="space-y-4 pt-6 border-t border-[#333333]">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Film className="w-5 h-5 text-[#EF6418]" />
                    Media & Metadata
                  </h2>
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail_url" className="text-white">Thumbnail URL</Label>
                    <Input
                      id="thumbnail_url"
                      name="thumbnail_url"
                      value={formData.thumbnail_url}
                      onChange={(e) => handleInputChange("thumbnail_url", e.target.value)}
                      className="bg-[#1F1F1F] border-[#333333] text-white focus:border-[#EF6418] focus:ring-[#EF6418]"
                      placeholder="https://..." />

                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="banner_image_url" className="text-white">Banner Image URL</Label>
                    <Input
                      id="banner_image_url"
                      name="banner_image_url"
                      value={formData.banner_image_url}
                      onChange={(e) => handleInputChange("banner_image_url", e.target.value)}
                      className="bg-[#1F1F1F] border-[#333333] text-white focus:border-[#EF6418] focus:ring-[#EF6418]"
                      placeholder="https://..." />

                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration_minutes" className="text-white">Duration (min)</Label>
                      <Input
                        id="duration_minutes"
                        name="duration_minutes"
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => handleInputChange("duration_minutes", e.target.value)}
                        className="bg-[#1F1F1F] border-[#333333] text-white focus:border-[#EF6418] focus:ring-[#EF6418]" />

                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="release_year" className="text-white">Year</Label>
                      <Input
                        id="release_year"
                        name="release_year"
                        type="number"
                        value={formData.release_year}
                        onChange={(e) => handleInputChange("release_year", e.target.value)}
                        className="bg-[#1F1F1F] border-[#333333] text-white focus:border-[#EF6418] focus:ring-[#EF6418]" />

                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="genre" className="text-white">Genre</Label>
                      <Input
                        id="genre"
                        name="genre"
                        value={formData.genre}
                        onChange={(e) => handleInputChange("genre", e.target.value)}
                        className="bg-[#1F1F1F] border-[#333333] text-white focus:border-[#EF6418] focus:ring-[#EF6418]" />

                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rating" className="text-white">Rating</Label>
                      <Input
                        id="rating"
                        name="rating"
                        value={formData.rating}
                        onChange={(e) => handleInputChange("rating", e.target.value)}
                        className="bg-[#1F1F1F] border-[#333333] text-white focus:border-[#EF6418] focus:ring-[#EF6418]"
                        placeholder="PG-13" />

                    </div>
                  </div>
                </div>

                {/* Stripe Pricing */}
                <div className="space-y-4 pt-6 border-t border-[#333333]">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Film className="w-5 h-5 text-[#EF6418]" />
                    Stripe Pricing
                  </h2>
                  <div className="space-y-2">
                    <Label htmlFor="stripe_product_id" className="text-white">Stripe Product ID</Label>
                    <div className="flex gap-2">
                      <Input
                        id="stripe_product_id"
                        name="stripe_product_id"
                        value={formData.stripe_product_id}
                        onChange={(e) => handleInputChange("stripe_product_id", e.target.value)}
                        className="bg-[#1F1F1F] border-[#333333] text-white font-mono flex-1 focus:border-[#EF6418] focus:ring-[#EF6418]"
                        placeholder="prod_..." />

                      <Button
                        type="button"
                        onClick={handleSyncStripePrice}
                        disabled={syncing || !formData.stripe_product_id}
                        className="btn-primary">

                        <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                    </div>
                    <p className="text-sm text-gray-400">
                      Paste the Product ID from your Stripe Dashboard. Click Sync to fetch pricing.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white">Rental Price</Label>
                      <div className="bg-[#1F1F1F] border-[#333333] rounded-md px-3 py-2 text-white">
                        {formatPrice(formData.rental_price_cents, formData.rental_currency)}
                      </div>
                      <p className="text-xs text-gray-500">Synced from Stripe</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Stripe Price ID</Label>
                      <div className="bg-[#1F1F1F] border-[#333333] rounded-md px-3 py-2 text-white font-mono text-sm truncate">
                        {formData.stripe_price_id || 'Not synced'}
                      </div>
                      <p className="text-xs text-gray-500">Synced from Stripe</p>
                    </div>
                  </div>

                  <Alert className="bg-blue-500/10 border-blue-500/30">
                    <AlertDescription className="text-blue-400 text-sm">
                      Prices are managed in Stripe. Changes in Stripe will automatically sync via webhook, 
                      or you can manually sync using the button above.
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Video Embeds */}
                <div className="space-y-4 pt-6 border-t border-[#333333]">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Film className="w-5 h-5 text-[#EF6418]" />
                    Video Embeds
                  </h2>
                  <div className="space-y-2">
                    <Label htmlFor="trailer_embed_code" className="text-white">Trailer Embed Code (Public)</Label>
                    <Textarea
                      id="trailer_embed_code"
                      name="trailer_embed_code"
                      value={formData.trailer_embed_code}
                      onChange={(e) => handleInputChange("trailer_embed_code", e.target.value)}
                      rows={6}
                      className="bg-[#1F1F1F] border-[#333333] text-white font-mono text-sm focus:border-[#EF6418] focus:ring-[#EF6418]"
                      placeholder='<iframe src="..." width="100%" height="100%" frameborder="0" allowfullscreen></iframe>' />

                    <p className="text-sm text-gray-400">
                      This will be shown to all users as a preview
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_movie_embed_code" className="text-white">Full Movie Embed Code (Protected)</Label>
                    <Textarea
                      id="full_movie_embed_code"
                      name="full_movie_embed_code"
                      value={formData.full_movie_embed_code}
                      onChange={(e) => handleInputChange("full_movie_embed_code", e.target.value)}
                      rows={6}
                      className="bg-[#1F1F1F] border-[#333333] text-white font-mono text-sm focus:border-[#EF6418] focus:ring-[#EF6418]"
                      placeholder='<iframe src="..." width="100%" height="100%" frameborder="0" allowfullscreen></iframe>' />

                    <p className="text-sm text-gray-400">
                      This will only be shown to users with an active rental
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hls_playback_url" className="text-white">HLS Playback URL (tvOS)</Label>
                    <Input
                      id="hls_playback_url"
                      name="hls_playback_url"
                      value={formData.hls_playback_url}
                      onChange={(e) => handleInputChange("hls_playback_url", e.target.value)}
                      className="bg-[#1F1F1F] border-[#333333] text-white font-mono text-sm focus:border-[#EF6418] focus:ring-[#EF6418]"
                      placeholder="https://.../.m3u8" />

                    <p className="text-sm text-gray-400">
                      HLS stream URL for tvOS app playback (protected, requires active rental)
                    </p>
                  </div>
                </div>

                {/* Publishing */}
                <div className="space-y-4 pt-6 border-t border-[#333333]">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Film className="w-5 h-5 text-[#EF6418]" />
                    Publishing
                  </h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="is_published" className="text-white">Published</Label>
                      <p className="text-sm text-gray-400 mt-1">
                        Make this film visible to users
                      </p>
                    </div>
                    <Switch
                      id="is_published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => handleInputChange("is_published", checked)}
                      className="data-[state=checked]:bg-[#EF6418]" />

                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="is_featured" className="text-white">Featured</Label>
                      <p className="text-sm text-gray-400 mt-1">
                        Display in the "Featured Films" section
                      </p>
                    </div>
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => handleInputChange("is_featured", checked)}
                      className="data-[state=checked]:bg-[#EF6418]" />

                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="is_new_release" className="text-white">New Release</Label>
                      <p className="text-sm text-gray-400 mt-1">
                        Display in the "New Releases" section
                      </p>
                    </div>
                    <Switch
                      id="is_new_release"
                      checked={formData.is_new_release}
                      onCheckedChange={(checked) => handleInputChange("is_new_release", checked)}
                      className="data-[state=checked]:bg-[#EF6418]" />

                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="is_trending" className="text-white">Trending</Label>
                      <p className="text-sm text-gray-400 mt-1">
                        Display in the "Trending Now" section
                      </p>
                    </div>
                    <Switch
                      id="is_trending"
                      checked={formData.is_trending}
                      onCheckedChange={(checked) => handleInputChange("is_trending", checked)}
                      className="data-[state=checked]:bg-[#EF6418]" />

                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="is_leaving_soon" className="text-white">Leaving Soon</Label>
                      <p className="text-sm text-gray-400 mt-1">
                        Display in the "Leaving Soon" section
                      </p>
                    </div>
                    <Switch
                      id="is_leaving_soon"
                      checked={formData.is_leaving_soon}
                      onCheckedChange={(checked) => handleInputChange("is_leaving_soon", checked)}
                      className="data-[state=checked]:bg-[#EF6418]" />

                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-6 border-t border-[#333333]">
                  <Link to={createPageUrl("AdminFilms")} className="flex-1">
                    <Button
                      type="button"
                      className="btn-secondary w-full">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={createFilmMutation.isPending || updateFilmMutation.isPending || syncing}
                    className="btn-primary flex-1">

                    {createFilmMutation.isPending || updateFilmMutation.isPending || syncing ?
                    <>Saving...</> :
                    filmId ?
                    <>Update Film</> :

                    <>Create Film</>
                    }
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>);

}