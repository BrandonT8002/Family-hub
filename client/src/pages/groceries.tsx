import { useState } from "react";
import { useGroceryLists, useCreateGroceryList, useUpdateGroceryList } from "@/hooks/use-groceries";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart, Plus, ChevronRight, Store, Tag, ListChecks, Lock, Globe, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function Groceries() {
  const { data: lists, isLoading } = useGroceryLists();
  const createList = useCreateGroceryList();
  const updateList = useUpdateGroceryList();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("Needs");
  const [storeName, setStoreName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createList.mutate(
      { name, type, storeName, isPrivate },
      { onSuccess: () => { 
        setIsOpen(false); 
        setName(""); 
        setStoreName("");
        setType("Needs");
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Shopping</h1>
          <p className="text-muted-foreground mt-2 text-lg">Lists for everything your family needs.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-12 px-6 shadow-lg shadow-primary/20 hover-elevate gap-2 text-base">
              <Plus className="w-5 h-5" /> New List
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl p-6 border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Create New List</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">List Name</label>
                <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weekly Groceries, Costco Run" className="rounded-xl h-12 bg-muted/50 border-transparent focus-visible:ring-primary/20 text-base" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold ml-1">Type</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Needs">Needs (Essentials)</SelectItem>
                      <SelectItem value="Wants">Wants (Wishlist)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold ml-1">Store (Optional)</label>
                  <Input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Walmart, Publix..." className="rounded-xl h-12 bg-muted/50 border-transparent focus-visible:ring-primary/20" />
                </div>
              </div>
              <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl">
                <div className="flex items-center gap-2">
                  {isPrivate ? <Lock className="w-4 h-4 text-muted-foreground" /> : <Globe className="w-4 h-4 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-semibold">{isPrivate ? "Private List" : "Shared List"}</p>
                    <p className="text-xs text-muted-foreground">{isPrivate ? "Only you can see this list" : "Visible to all family members"}</p>
                  </div>
                </div>
                <Switch checked={isPrivate} onCheckedChange={setIsPrivate} data-testid="switch-private" />
              </div>
              <Button type="submit" disabled={createList.isPending} className="w-full rounded-2xl h-14 text-lg font-bold shadow-xl shadow-primary/10 mt-2" data-testid="button-create-list">
                {createList.isPending ? "Creating..." : "Start List"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-muted/50 rounded-3xl animate-pulse" />)}
        </div>
      ) : lists?.length === 0 ? (
        <Card className="rounded-[2.5rem] border-dashed border-2 border-border/50 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center p-10">
            <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mb-6">
              <ShoppingCart className="w-10 h-10 text-primary opacity-40" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">No active lists</h2>
            <p className="text-muted-foreground max-w-sm mb-8">Create your first shopping list to stay organized and keep everyone in sync.</p>
            <Button onClick={() => setIsOpen(true)} className="rounded-2xl h-12 px-8">Create Your First List</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists?.map((list) => (
            <div key={list.id} className="relative group" data-testid={`card-list-${list.id}`}>
              <Link href={`/groceries/${list.id}`}>
                <Card className="rounded-[2rem] border-border/50 hover-elevate cursor-pointer h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                  <CardHeader className="p-6 pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-3 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <ListChecks className="w-6 h-6" />
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
                      {list.storeName && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 w-fit px-3 py-1.5 rounded-xl font-medium">
                          <Store className="w-4 h-4" /> {list.storeName}
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
          ))}
        </div>
      )}
    </div>
  );
}
