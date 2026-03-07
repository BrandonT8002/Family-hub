import { useState, useMemo } from "react";
import { useGroceryLists, useCreateGroceryList, useUpdateGroceryList } from "@/hooks/use-groceries";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Plus, ChevronRight, Store, ListChecks, Lock, Globe, MoreVertical, ShoppingBag, Home, Wrench, BookOpen, Baby, PawPrint, Pill, Laptop, Package, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const LIST_CATEGORIES = [
  { value: "Groceries", label: "Groceries", icon: ShoppingCart },
  { value: "Household", label: "Household", icon: Home },
  { value: "School Supplies", label: "School Supplies", icon: BookOpen },
  { value: "Home Improvement", label: "Home Improvement", icon: Wrench },
  { value: "Baby & Kids", label: "Baby & Kids", icon: Baby },
  { value: "Pet Supplies", label: "Pet Supplies", icon: PawPrint },
  { value: "Health & Pharmacy", label: "Health & Pharmacy", icon: Pill },
  { value: "Electronics", label: "Electronics", icon: Laptop },
  { value: "General", label: "General Shopping", icon: ShoppingBag },
  { value: "Other", label: "Other", icon: Package },
];

function getCategoryIcon(cat: string) {
  const found = LIST_CATEGORIES.find(c => c.value === cat);
  return found ? found.icon : ShoppingBag;
}

export default function Groceries() {
  const { data: lists, isLoading } = useGroceryLists();
  const createList = useCreateGroceryList();
  const updateList = useUpdateGroceryList();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("Needs");
  const [listCategory, setListCategory] = useState("Groceries");
  const [storeName, setStoreName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createList.mutate(
      { name, type, listCategory, storeName, isPrivate },
      { onSuccess: () => { 
        setIsOpen(false); 
        setName(""); 
        setStoreName("");
        setType("Needs");
        setListCategory("Groceries");
        setIsPrivate(false);
      } }
    );
  };

  const togglePrivacy = (listId: number, currentPrivate: boolean) => {
    updateList.mutate(
      { id: listId, isPrivate: !currentPrivate },
      { onSuccess: () => {
        toast({ title: !currentPrivate ? "List set to private" : "List shared with family" });
      }}
    );
  };

  const filteredLists = useMemo(() => {
    if (!lists) return [];
    if (filterCategory === "all") return lists;
    return lists.filter((l: any) => (l.listCategory || "Groceries") === filterCategory);
  }, [lists, filterCategory]);

  const usedCategories = useMemo(() => {
    if (!lists) return [];
    const cats = new Set(lists.map((l: any) => l.listCategory || "Groceries"));
    return Array.from(cats);
  }, [lists]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight" data-testid="text-shopping-title">Shopping</h1>
          <p className="text-muted-foreground mt-2 text-lg">Lists for everything your family needs.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-12 px-6 shadow-lg shadow-primary/20 hover-elevate gap-2 text-base" data-testid="button-new-list">
              <Plus className="w-5 h-5" /> New List
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl p-6 border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Create New List</DialogTitle>
              <DialogDescription>Add a new shopping list for your family</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">List Name</label>
                <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weekly Groceries, School Supplies" className="rounded-xl h-12 bg-muted/50 border-transparent focus-visible:ring-primary/20 text-base" autoFocus data-testid="input-list-name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">Category</label>
                <Select value={listCategory} onValueChange={setListCategory}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-transparent" data-testid="select-list-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {LIST_CATEGORIES.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="flex items-center gap-2"><Icon className="w-4 h-4" /> {cat.label}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold ml-1">Type</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-transparent" data-testid="select-list-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Needs">Needs (Essentials)</SelectItem>
                      <SelectItem value="Wants">Wants</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold ml-1">Store (Optional)</label>
                  <Input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Walmart, Target..." className="rounded-xl h-12 bg-muted/50 border-transparent focus-visible:ring-primary/20" data-testid="input-store-name" />
                </div>
              </div>
              <div className={`p-4 rounded-xl border-2 transition-colors ${isPrivate ? 'bg-muted/30 border-muted' : 'bg-primary/5 border-primary/30'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isPrivate ? 'bg-muted' : 'bg-primary/10'}`}>
                      {isPrivate ? <Lock className="w-5 h-5 text-muted-foreground" /> : <Users className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{isPrivate ? "Private List" : "Shared with Family"}</p>
                      <p className="text-xs text-muted-foreground">{isPrivate ? "Only you can see and edit this list" : "Everyone in your family can view, add items, and check things off"}</p>
                    </div>
                  </div>
                  <Switch checked={isPrivate} onCheckedChange={setIsPrivate} data-testid="switch-private" />
                </div>
              </div>
              <Button type="submit" disabled={createList.isPending} className="w-full rounded-2xl h-14 text-lg font-bold shadow-xl shadow-primary/10 mt-2" data-testid="button-create-list">
                {createList.isPending ? "Creating..." : "Start List"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {usedCategories.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterCategory === "all" ? "default" : "outline"}
            size="sm"
            className="rounded-xl text-xs"
            onClick={() => setFilterCategory("all")}
            data-testid="filter-all"
          >
            All
          </Button>
          {usedCategories.map(cat => {
            const Icon = getCategoryIcon(cat);
            return (
              <Button
                key={cat}
                variant={filterCategory === cat ? "default" : "outline"}
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setFilterCategory(cat)}
                data-testid={`filter-${cat.toLowerCase().replace(/\s/g, '-')}`}
              >
                <Icon className="w-3 h-3 mr-1" />{cat}
              </Button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-muted/50 rounded-3xl animate-pulse" />)}
        </div>
      ) : filteredLists.length === 0 ? (
        <Card className="rounded-[2.5rem] border-dashed border-2 border-border/50 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center p-10">
            <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mb-6">
              <ShoppingCart className="w-10 h-10 text-primary opacity-40" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">No active lists</h2>
            <p className="text-muted-foreground max-w-sm mb-8">Create your first shopping list to stay organized and keep everyone in sync.</p>
            <Button onClick={() => setIsOpen(true)} className="rounded-2xl h-12 px-8" data-testid="button-empty-new-list">Create Your First List</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLists.map((list: any) => {
            const CatIcon = getCategoryIcon(list.listCategory || "Groceries");
            return (
              <div key={list.id} className="relative group" data-testid={`card-list-${list.id}`}>
                <Link href={`/groceries/${list.id}`}>
                  <Card className="rounded-[2rem] border-border/50 hover-elevate cursor-pointer h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                    <CardHeader className="p-6 pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="p-3 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                          <CatIcon className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-2">
                          {list.isPrivate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg" data-testid={`badge-private-${list.id}`}>
                              <Lock className="w-3 h-3" /> Private
                            </div>
                          )}
                          <Badge variant={list.type === "Wants" ? "secondary" : "default"} className="rounded-lg px-2.5 py-1">
                            {list.type}
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-2xl font-display font-bold group-hover:text-primary transition-colors">{list.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="rounded-lg text-xs">
                            {list.listCategory || "Groceries"}
                          </Badge>
                          {list.storeName && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Store className="w-3.5 h-3.5" /> {list.storeName}
                            </div>
                          )}
                        </div>
                        {!list.isPrivate && (
                          <div className="flex items-center gap-1.5 text-xs text-primary/70" data-testid={`badge-shared-${list.id}`}>
                            <Users className="w-3.5 h-3.5" />
                            <span className="font-medium">Shared with family</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm pt-2">
                          <span className="text-muted-foreground font-medium">Tap to open list</span>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm" data-testid={`button-list-menu-${list.id}`}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem 
                        onClick={(e) => { e.preventDefault(); togglePrivacy(list.id, !!list.isPrivate); }}
                        className="gap-2"
                        data-testid={`button-toggle-privacy-${list.id}`}
                      >
                        {list.isPrivate ? <><Globe className="w-4 h-4" /> Share with Family</> : <><Lock className="w-4 h-4" /> Make Private</>}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
