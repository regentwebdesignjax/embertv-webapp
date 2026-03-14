import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, Eye, Sparkles, Flame, TrendingUp, Clock, GripVertical, ListOrdered } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminFilms() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [filmToDelete, setFilmToDelete] = React.useState(null);
  const [isReorderModalOpen, setIsReorderModalOpen] = React.useState(false);
  const [reorderList, setReorderList] = React.useState([]);

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
      base44.auth.redirectToLogin(createPageUrl("AdminFilms"));
    }
  };

  const { data: films, isLoading: filmsLoading } = useQuery({
    queryKey: ['admin-films'],
    queryFn: () => base44.entities.Film.list('-created_date'),
    initialData: [],
  });

  const saveFeaturedOrderMutation = useMutation({
    mutationFn: (orderedFilms) =>
      Promise.all(orderedFilms.map((film, index) => base44.entities.Film.update(film.id, { featured_order: index }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-films'] });
      queryClient.invalidateQueries({ queryKey: ['published-films'] });
      setIsReorderModalOpen(false);
      toast.success("Featured order saved successfully");
    },
  });

  const openReorderModal = () => {
    const featured = [...films]
      .filter(f => f.is_featured)
      .sort((a, b) => (a.featured_order ?? 999) - (b.featured_order ?? 999));
    setReorderList(featured);
    setIsReorderModalOpen(true);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(reorderList);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setReorderList(items);
  };

  const togglePlacementMutation = useMutation({
    mutationFn: ({ id, field, newValue }) => base44.entities.Film.update(id, { [field]: newValue }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-films'] }),
  });

  const deleteFilmMutation = useMutation({
    mutationFn: (id) => base44.entities.Film.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-films'] });
      setDeleteDialogOpen(false);
      setFilmToDelete(null);
    },
  });

  const handleDeleteClick = (film) => {
    setFilmToDelete(film);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (filmToDelete) {
      deleteFilmMutation.mutate(filmToDelete.id);
    }
  };

  const formatPrice = (film) => {
    if (!film.rental_price_cents) return 'Not set';
    const price = (film.rental_price_cents / 100).toFixed(2);
    const currency = (film.rental_currency || 'usd').toUpperCase();
    return `$${price} ${currency}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#EF6418]"></div>
      </div>
    );
  }

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
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Film Management</h1>
              <p className="text-gray-400">{films.length} total films</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={openReorderModal} className="btn-secondary">
                <ListOrdered className="w-4 h-4 mr-2" />
                Reorder Featured
              </Button>
              <Link to={createPageUrl("AdminFilmForm")}>
                <Button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Film
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-[#1A1A1A] rounded-xl border border-[#333333] overflow-hidden"
        >
          {filmsLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EF6418] mx-auto"></div>
            </div>
          ) : films.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-lg mb-4">No films yet</p>
              <Link to={createPageUrl("AdminFilmForm")}>
                <Button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Film
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#333333] hover:bg-transparent">
                    <TableHead className="text-gray-400">Title</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Placements</TableHead>
                    <TableHead className="text-gray-400">Rental Price</TableHead>
                    <TableHead className="text-gray-400">Stripe Product</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {films.map((film) => (
                    <TableRow key={film.id} className="border-[#333333] hover:bg-white/5">
                      <TableCell className="font-medium text-white">
                       <div>
                         <div>{film.title}</div>
                         <div className="text-xs text-gray-500 mt-1">{film.slug}</div>
                       </div>
                      </TableCell>
                      <TableCell>
                       {film.is_published ? (
                         <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                           Published
                         </Badge>
                       ) : (
                         <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                           Draft
                         </Badge>
                       )}
                      </TableCell>
                      <TableCell>
                       <div className="flex gap-1">
                         {[
                           { field: 'is_featured', icon: Sparkles, label: 'Featured' },
                           { field: 'is_new_release', icon: Flame, label: 'New Release' },
                           { field: 'is_trending', icon: TrendingUp, label: 'Trending' },
                           { field: 'is_leaving_soon', icon: Clock, label: 'Leaving Soon' },
                         ].map(({ field, icon: Icon, label }) => (
                           <button
                             key={field}
                             title={`Toggle ${label}`}
                             onClick={() => togglePlacementMutation.mutate({ id: film.id, field, newValue: !film[field] })}
                             className={`p-1.5 rounded border transition-colors duration-200 ${
                               film[field]
                                 ? 'bg-[#EF6418]/20 text-[#EF6418] border-[#EF6418]/50'
                                 : 'text-gray-500 border-[#333333] hover:text-white hover:border-gray-500'
                             }`}
                           >
                             <Icon className="w-3.5 h-3.5" />
                           </button>
                         ))}
                       </div>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {formatPrice(film)}
                      </TableCell>
                      <TableCell className="text-gray-400 font-mono text-xs">
                        {film.stripe_product_id ? (
                          <span className="truncate block max-w-[150px]">
                            {film.stripe_product_id}
                          </span>
                        ) : (
                          <span className="text-gray-600">Not linked</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={createPageUrl(`FilmDetail?slug=${film.slug}`)}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-white hover:bg-white/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link to={createPageUrl(`AdminFilmForm?id=${film.id}`)}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-white hover:bg-white/10"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(film)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Reorder Featured Modal */}
      <Dialog open={isReorderModalOpen} onOpenChange={setIsReorderModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#333333] text-white max-w-md !translate-x-0 !translate-y-0 !top-0 !bottom-0 !left-0 !right-0 !m-auto h-fit max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Reorder Featured Films</DialogTitle>
            <DialogDescription className="text-gray-400">
              Drag and drop to set the hero carousel order.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 overflow-y-auto flex-1">
            {reorderList.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No featured films found.</p>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="featured-films">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {reorderList.map((film, index) => (
                        <Draggable key={film.id} draggableId={film.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-[#0A0A0A] border border-[#333333] p-3 rounded-md flex items-center gap-3 mb-2 transition-shadow ${snapshot.isDragging ? 'shadow-lg shadow-[#EF6418]/20 border-[#EF6418]/40' : ''}`}
                            >
                              <GripVertical className="w-4 h-4 text-gray-500 cursor-grab flex-none" />
                              {film.thumbnail_url && (
                                <img src={film.thumbnail_url} alt={film.title} className="w-10 h-14 object-cover rounded flex-none" />
                              )}
                              <span className="font-medium text-white text-sm">{film.title}</span>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsReorderModalOpen(false)} className="btn-secondary">Cancel</Button>
            <Button
              onClick={() => saveFeaturedOrderMutation.mutate(reorderList)}
              disabled={saveFeaturedOrderMutation.isPending}
              className="btn-primary"
            >
              {saveFeaturedOrderMutation.isPending ? 'Saving...' : 'Save Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#333333] text-white">
          <DialogHeader>
            <DialogTitle>Delete Film</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete "{filmToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteFilmMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {deleteFilmMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}