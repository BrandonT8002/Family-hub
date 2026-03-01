import { useState, useMemo } from "react";
import { useWishlists, useWishlistItems, useCreateWishlist, useUpdateWishlist, useDeleteWishlist, useCreateWishlistItem, useUpdateWishlistItem, useDeleteWishlistItem } from "@/hooks/use-wishlists";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Heart, Plus, MoreVertical, Trash2, Edit, Gift, Star, ShoppingBag, ChevronRight, Lock, Globe, Users, User, DollarSign, ExternalLink, Loader2, X, ArrowLeft, Check, CircleDot } from "lucide-react";
import type { Wishlist, WishlistItem } from "@shared/schema";

const ITEM_CATEGORIES = [
  "Clothing", "Tech", "Books", "Home", "Kitchen", "Sports", "Beauty",
  "Toys", "Games", "Music", "Art", "Travel", "Food", "Furniture", "Other"
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-blue-500 bg-blue-50",
  medium: "text-amber-600 bg-amber-50",
  high: "text-red-500 bg-red-50",
};

function WishlistDetailView({ wishlist, onBack }: { wishlist: Wishlist; onBack: () => void }) {
  const { data: items = [], isLoading } = useWishlistItems(wishlist.id);
  const { user } = useAuth();
  const { toast } = useToast();
  const createItem = useCreateWishlistItem();
  const updateItem = useUpdateWishlistItem();
  const deleteItem = useDeleteWishlistItem();

  const isOwner = user?.id === wishlist.creatorId;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [form, setForm] = useState({
    name: "", category: "", estimatedPrice: "", storeName: "",
    storeLink: "", notes: "", priority: "medium", wantOrNeed: "want"
  });

  const resetForm = () => setForm({
    name: "", category: "", estimatedPrice: "", storeName: "",
    storeLink: "", notes: "", priority: "medium", wantOrNeed: "want"
  });

  const openAdd = () => {
    setEditingItem(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (item: WishlistItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category || "",
      estimatedPrice: item.estimatedPrice ? String(parseFloat(item.estimatedPrice)) : "",
      storeName: item.storeName || "",
      storeLink: item.storeLink || "",
      notes: item.notes || "",
      priority: item.priority || "medium",
      wantOrNeed: item.wantOrNeed || "want",
    });
    setDialogOpen(true);
  };

  const handleSaveItem = () => {
    if (!form.name.trim()) {
      toast({ title: "Please enter an item name", variant: "destructive" });
      return;
    }
    const payload = {
      wishlistId: wishlist.id,
      name: form.name.trim(),
      category: form.category || null,
      estimatedPrice: form.estimatedPrice || null,
      storeName: form.storeName || null,
      storeLink: form.storeLink || null,
      notes: form.notes || null,
      priority: form.priority,
      wantOrNeed: form.wantOrNeed,
    };

    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, ...payload }, {
        onSuccess: () => { setDialogOpen(false); setEditingItem(null); resetForm(); toast({ title: "Item updated" }); },
        onError: () => toast({ title: "Failed to update item", variant: "destructive" }),
      });
    } else {
      createItem.mutate(payload, {
        onSuccess: () => { setDialogOpen(false); resetForm(); toast({ title: "Item added" }); },
        onError: () => toast({ title: "Failed to add item", variant: "destructive" }),
      });
    }
  };

  const handleClaim = (item: WishlistItem) => {
    if (!user) return;
    if (item.claimedBy === user.id) {
      updateItem.mutate({ id: item.id, wishlistId: wishlist.id, status: "unclaimed", claimedBy: null, claimedNote: null }, {
        onSuccess: () => toast({ title: "Claim removed" }),
      });
    } else {
      updateItem.mutate({ id: item.id, wishlistId: wishlist.id, status: "claimed", claimedBy: user.id }, {
        onSuccess: () => toast({ title: "Item claimed! The surprise is safe." }),
      });
    }
  };

  const handlePurchased = (item: WishlistItem) => {
    updateItem.mutate({ id: item.id, wishlistId: wishlist.id, status: "purchased" }, {
      onSuccess: () => toast({ title: "Marked as purchased" }),
    });
  };

  const totalEstimate = useMemo(() => {
    return items.reduce((sum, i) => sum + parseFloat(i.estimatedPrice || "0"), 0);
  }, [items]);

  const claimedCount = items.filter(i => i.status === "claimed" || i.status === "purchased").length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1" data-testid="button-back-wishlists">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold" data-testid="text-wishlist-name">{wishlist.name}</h1>
            {wishlist.visibility === "private" && <Lock className="w-4 h-4 text-muted-foreground" />}
          </div>
          {wishlist.description && <p className="text-muted-foreground">{wishlist.description}</p>}
        </div>
        <div className="flex gap-3">
          <Card className="bg-primary/5 border-primary/20 rounded-2xl p-4 shadow-sm min-w-[160px]">
            <div className="text-xs font-semibold text-primary/70 uppercase tracking-wider mb-1">Total Estimate</div>
            <div className="text-2xl font-bold" data-testid="text-total-estimate">${totalEstimate.toFixed(2)}</div>
          </Card>
          <Card className="bg-emerald-50 border-emerald-200 rounded-2xl p-4 shadow-sm min-w-[120px]">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Claimed</div>
            <div className="text-2xl font-bold text-emerald-600" data-testid="text-claimed-count">{claimedCount}/{items.length}</div>
          </Card>
        </div>
      </div>

      {isOwner && (
        <Button onClick={openAdd} className="rounded-2xl" data-testid="button-add-wishlist-item">
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <Card className="bg-white/50 border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Gift className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-muted-foreground mb-2">No items yet</h3>
            <p className="text-sm text-muted-foreground">Add items to your wishlist to share what you'd love</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Card
              key={item.id}
              className={`bg-white/80 backdrop-blur-sm border-0 shadow-sm ${isOwner ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
              onClick={() => isOwner && openEdit(item)}
              data-testid={`wishlist-item-${item.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`font-semibold ${item.status === "purchased" ? "line-through text-muted-foreground" : ""}`}>{item.name}</span>
                      <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[item.priority || "medium"]}`}>
                        {item.priority}
                      </Badge>
                      <Badge variant={item.wantOrNeed === "need" ? "default" : "secondary"} className="text-xs">
                        {item.wantOrNeed === "need" ? "Need" : "Want"}
                      </Badge>
                      {item.status === "claimed" && (
                        <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">Claimed</Badge>
                      )}
                      {item.status === "purchased" && (
                        <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">Purchased</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      {item.estimatedPrice && parseFloat(item.estimatedPrice) > 0 && (
                        <span className="flex items-center gap-1 font-medium">
                          <DollarSign className="w-3 h-3" />{parseFloat(item.estimatedPrice).toFixed(2)}
                        </span>
                      )}
                      {item.category && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{item.category}</span>
                      )}
                      {item.storeName && (
                        <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" />{item.storeName}</span>
                      )}
                      {item.storeLink && (
                        <a href={item.storeLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline" onClick={e => e.stopPropagation()} data-testid={`link-store-${item.id}`}>
                          <ExternalLink className="w-3 h-3" />Link
                        </a>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{item.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    {!isOwner && item.status !== "purchased" && (
                      <Button
                        size="sm"
                        variant={item.claimedBy === user?.id ? "default" : "outline"}
                        onClick={() => handleClaim(item)}
                        className="text-xs h-8"
                        data-testid={`button-claim-${item.id}`}
                      >
                        {item.claimedBy === user?.id ? "Unclaim" : "Claim"}
                      </Button>
                    )}
                    {!isOwner && item.claimedBy === user?.id && item.status === "claimed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePurchased(item)}
                        className="text-xs h-8"
                        data-testid={`button-purchased-${item.id}`}
                      >
                        <Check className="w-3 h-3 mr-1" />Purchased
                      </Button>
                    )}
                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`menu-item-${item.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(item)} data-testid={`edit-item-${item.id}`}>
                            <Edit className="w-4 h-4 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteItem.mutate({ id: item.id, wishlistId: wishlist.id }, {
                            onSuccess: () => toast({ title: "Item removed" }),
                          })} className="text-red-600" data-testid={`delete-item-${item.id}`}>
                            <Trash2 className="w-4 h-4 mr-2" />Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingItem(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Wishlist Item"}</DialogTitle>
            <DialogDescription>{editingItem ? "Update the details for this item." : "What would you love to have?"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Item Name</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., AirPods Pro" data-testid="input-wishitem-name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={form.category || "none"} onValueChange={v => setForm({ ...form, category: v === "none" ? "" : v })}>
                  <SelectTrigger data-testid="select-wishitem-category"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {ITEM_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Estimated Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input type="number" step="0.01" value={form.estimatedPrice} onChange={e => setForm({ ...form, estimatedPrice: e.target.value })} placeholder="0.00" className="pl-7" data-testid="input-wishitem-price" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Store Name</label>
                <Input value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })} placeholder="Amazon, Target..." data-testid="input-wishitem-store" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Store Link</label>
                <Input value={form.storeLink} onChange={e => setForm({ ...form, storeLink: e.target.value })} placeholder="https://..." data-testid="input-wishitem-link" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Priority</label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger data-testid="select-wishitem-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Want or Need</label>
                <Select value={form.wantOrNeed} onValueChange={v => setForm({ ...form, wantOrNeed: v })}>
                  <SelectTrigger data-testid="select-wishitem-wantneed"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="want">Want</SelectItem>
                    <SelectItem value="need">Need</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Size, color, version preference..." rows={2} className="resize-none" data-testid="input-wishitem-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingItem(null); }} data-testid="button-cancel-wishitem">Cancel</Button>
            <Button onClick={handleSaveItem} disabled={editingItem ? updateItem.isPending : createItem.isPending} data-testid="button-save-wishitem">
              {(editingItem ? updateItem.isPending : createItem.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {editingItem ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Wishlists() {
  const { data: wishlists = [], isLoading } = useWishlists();
  const { user } = useAuth();
  const { toast } = useToast();
  const createWishlist = useCreateWishlist();
  const deleteWishlist = useDeleteWishlist();

  const [selectedWishlist, setSelectedWishlist] = useState<Wishlist | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingWl, setDeletingWl] = useState<Wishlist | null>(null);

  const [wlForm, setWlForm] = useState({ name: "", description: "", visibility: "family", hideClaimedBy: true });

  const resetWlForm = () => setWlForm({ name: "", description: "", visibility: "family", hideClaimedBy: true });

  const handleCreate = () => {
    if (!wlForm.name.trim()) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }
    createWishlist.mutate(wlForm, {
      onSuccess: () => { setCreateOpen(false); resetWlForm(); toast({ title: "Wishlist created!" }); },
      onError: () => toast({ title: "Failed to create wishlist", variant: "destructive" }),
    });
  };

  const handleDelete = () => {
    if (!deletingWl) return;
    deleteWishlist.mutate(deletingWl.id, {
      onSuccess: () => { setDeletingWl(null); toast({ title: "Wishlist deleted" }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  if (selectedWishlist) {
    return <WishlistDetailView wishlist={selectedWishlist} onBack={() => setSelectedWishlist(null)} />;
  }

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  const myLists = wishlists.filter(w => w.creatorId === user?.id);
  const familyLists = wishlists.filter(w => w.creatorId !== user?.id && w.visibility === "family");

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-wishlists-title">
            <Heart className="w-6 h-6" />Wishlists
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Share what you'd love, coordinate gifts, and stay organized</p>
        </div>
        <Button size="sm" onClick={() => { resetWlForm(); setCreateOpen(true); }} data-testid="button-new-wishlist">
          <Plus className="w-4 h-4 mr-1" />New Wishlist
        </Button>
      </div>

      {myLists.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Wishlists</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {myLists.map(wl => (
              <Card
                key={wl.id}
                className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedWishlist(wl)}
                data-testid={`card-wishlist-${wl.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-pink-50">
                        <Gift className="w-5 h-5 text-pink-500" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{wl.name}</CardTitle>
                        {wl.description && <p className="text-xs text-muted-foreground mt-0.5">{wl.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Badge variant="secondary" className="text-xs">
                        {wl.visibility === "private" ? <><Lock className="w-3 h-3 mr-1" />Private</> : <><Users className="w-3 h-3 mr-1" />Family</>}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" data-testid={`menu-wishlist-${wl.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDeletingWl(wl)} className="text-red-600" data-testid={`delete-wishlist-${wl.id}`}>
                            <Trash2 className="w-4 h-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>View items</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {familyLists.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Family Wishlists</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {familyLists.map(wl => (
              <Card
                key={wl.id}
                className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedWishlist(wl)}
                data-testid={`card-wishlist-${wl.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-violet-50">
                      <Gift className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{wl.name}</CardTitle>
                      {wl.description && <p className="text-xs text-muted-foreground mt-0.5">{wl.description}</p>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>View & claim items</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {wishlists.length === 0 && (
        <Card className="bg-white/50 border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-muted-foreground mb-2">No wishlists yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create a wishlist to share what you'd love with your family</p>
            <Button onClick={() => { resetWlForm(); setCreateOpen(true); }} data-testid="button-empty-new-wishlist">
              <Plus className="w-4 h-4 mr-1" />Create Your First Wishlist
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Wishlist</DialogTitle>
            <DialogDescription>Create a wishlist to share what you'd love</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input value={wlForm.name} onChange={e => setWlForm({ ...wlForm, name: e.target.value })} placeholder="e.g., Birthday List, Christmas Ideas" data-testid="input-wishlist-name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description (optional)</label>
              <Input value={wlForm.description} onChange={e => setWlForm({ ...wlForm, description: e.target.value })} placeholder="A few words about this list" data-testid="input-wishlist-description" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Visibility</label>
              <Select value={wlForm.visibility} onValueChange={v => setWlForm({ ...wlForm, visibility: v })}>
                <SelectTrigger data-testid="select-wishlist-visibility"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family (everyone can see)</SelectItem>
                  <SelectItem value="private">Private (only you)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl">
              <div>
                <p className="text-sm font-medium">Hide who claimed items</p>
                <p className="text-xs text-muted-foreground">Keep gift surprises intact</p>
              </div>
              <Switch checked={wlForm.hideClaimedBy} onCheckedChange={v => setWlForm({ ...wlForm, hideClaimedBy: v })} data-testid="switch-hide-claimed" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} data-testid="button-cancel-wishlist">Cancel</Button>
            <Button onClick={handleCreate} disabled={createWishlist.isPending} data-testid="button-create-wishlist">
              {createWishlist.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Create Wishlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingWl} onOpenChange={o => !o && setDeletingWl(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Wishlist</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deletingWl?.name}"? All items will be removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-wl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" data-testid="button-confirm-delete-wl">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
