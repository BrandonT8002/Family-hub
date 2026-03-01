import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, Plus, Loader2, MoreVertical, Edit, Trash2, Calendar, Gift, MessageCircle, Heart, Link2 } from "lucide-react";

interface ConnectionPermissions {
  sharedEvents: boolean;
  sharedWishlists: boolean;
  chat: boolean;
  careNotes: boolean;
}

interface FamilyConnection {
  id: number;
  requestingFamilyId: number;
  targetFamilyId: number;
  status: "pending" | "active" | "declined";
  permissions: ConnectionPermissions;
  otherFamily: { id: number; name: string };
  direction: "sent" | "received";
}

const PERMISSION_LABELS: { key: keyof ConnectionPermissions; label: string; icon: typeof Calendar }[] = [
  { key: "sharedEvents", label: "Shared Events", icon: Calendar },
  { key: "sharedWishlists", label: "Shared Wishlists", icon: Gift },
  { key: "chat", label: "Chat", icon: MessageCircle },
  { key: "careNotes", label: "Care Notes", icon: Heart },
];

function PermissionBadges({ permissions }: { permissions: ConnectionPermissions }) {
  return (
    <div className="flex flex-wrap gap-1">
      {PERMISSION_LABELS.filter(p => permissions[p.key]).map(p => {
        const Icon = p.icon;
        return (
          <Badge key={p.key} variant="secondary" className="text-xs" data-testid={`badge-permission-${p.key}`}>
            <Icon className="w-3 h-3 mr-1" />{p.label}
          </Badge>
        );
      })}
    </div>
  );
}

function PermissionToggles({ permissions, onChange }: { permissions: ConnectionPermissions; onChange: (p: ConnectionPermissions) => void }) {
  return (
    <div className="space-y-3">
      {PERMISSION_LABELS.map(p => {
        const Icon = p.icon;
        return (
          <div key={p.key} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span>{p.label}</span>
            </div>
            <Switch
              checked={permissions[p.key]}
              onCheckedChange={(checked) => onChange({ ...permissions, [p.key]: checked })}
              data-testid={`switch-permission-${p.key}`}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function Connections() {
  const { toast } = useToast();

  const { data: connections = [], isLoading } = useQuery<FamilyConnection[]>({
    queryKey: ["/api/family-connections"],
  });

  const [connectOpen, setConnectOpen] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [newPermissions, setNewPermissions] = useState<ConnectionPermissions>({
    sharedEvents: true, sharedWishlists: false, chat: false, careNotes: false,
  });

  const [editingConnection, setEditingConnection] = useState<FamilyConnection | null>(null);
  const [editPermissions, setEditPermissions] = useState<ConnectionPermissions>({
    sharedEvents: true, sharedWishlists: false, chat: false, careNotes: false,
  });

  const [disconnecting, setDisconnecting] = useState<FamilyConnection | null>(null);

  const createMutation = useMutation({
    mutationFn: (body: { targetFamilyName: string; permissions: ConnectionPermissions }) =>
      apiRequest("POST", "/api/family-connections", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-connections"] });
      setConnectOpen(false);
      setFamilyName("");
      setNewPermissions({ sharedEvents: true, sharedWishlists: false, chat: false, careNotes: false });
      toast({ title: "Connection request sent" });
    },
    onError: (err: Error) => toast({ title: err.message || "Failed to send request", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: number; status?: string; permissions?: ConnectionPermissions }) =>
      apiRequest("PATCH", `/api/family-connections/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-connections"] });
      setEditingConnection(null);
      toast({ title: "Connection updated" });
    },
    onError: () => toast({ title: "Failed to update connection", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/family-connections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-connections"] });
      setDisconnecting(null);
      toast({ title: "Connection removed" });
    },
    onError: () => toast({ title: "Failed to remove connection", variant: "destructive" }),
  });

  const activeConnections = connections.filter(c => c.status === "active");
  const pendingSent = connections.filter(c => c.status === "pending" && c.direction === "sent");
  const pendingReceived = connections.filter(c => c.status === "pending" && c.direction === "received");
  const hasConnections = connections.length > 0;

  const handleSendRequest = () => {
    if (!familyName.trim()) {
      toast({ title: "Please enter a family name", variant: "destructive" });
      return;
    }
    createMutation.mutate({ targetFamilyName: familyName.trim(), permissions: newPermissions });
  };

  const handleAccept = (conn: FamilyConnection) => {
    updateMutation.mutate({ id: conn.id, status: "active" });
  };

  const handleDecline = (conn: FamilyConnection) => {
    updateMutation.mutate({ id: conn.id, status: "declined" });
  };

  const handleEditPermissions = (conn: FamilyConnection) => {
    setEditingConnection(conn);
    setEditPermissions({ ...conn.permissions });
  };

  const handleSavePermissions = () => {
    if (!editingConnection) return;
    updateMutation.mutate({ id: editingConnection.id, permissions: editPermissions });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-connections">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 pb-32">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-connections-title">
            <Users className="w-6 h-6" />Family Connections
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-connections-intro">
            Connect with other families for coordination — holiday planning, gift sharing, event scheduling — without sharing private data.
          </p>
        </div>
        <Button onClick={() => setConnectOpen(true)} data-testid="button-connect-family">
          <Plus className="w-4 h-4 mr-1" />Connect Family
        </Button>
      </div>

      {pendingReceived.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide" data-testid="text-section-received">
            Incoming Requests
          </h2>
          {pendingReceived.map(conn => (
            <Card key={conn.id} data-testid={`card-connection-received-${conn.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-medium" data-testid={`text-family-name-${conn.id}`}>{conn.otherFamily.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Wants to connect with your family</p>
                    <div className="mt-2">
                      <PermissionBadges permissions={conn.permissions} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleDecline(conn)}
                      disabled={updateMutation.isPending}
                      data-testid={`button-decline-${conn.id}`}
                    >
                      Decline
                    </Button>
                    <Button
                      onClick={() => handleAccept(conn)}
                      disabled={updateMutation.isPending}
                      data-testid={`button-accept-${conn.id}`}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pendingSent.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide" data-testid="text-section-sent">
            Pending Requests
          </h2>
          {pendingSent.map(conn => (
            <Card key={conn.id} data-testid={`card-connection-sent-${conn.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium" data-testid={`text-family-name-${conn.id}`}>{conn.otherFamily.name}</p>
                    <Badge variant="secondary" data-testid={`badge-pending-${conn.id}`}>Pending</Badge>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setDisconnecting(conn)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-cancel-request-${conn.id}`}
                  >
                    Cancel Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeConnections.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide" data-testid="text-section-active">
            Active Connections
          </h2>
          {activeConnections.map(conn => (
            <Card key={conn.id} data-testid={`card-connection-active-${conn.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-medium" data-testid={`text-family-name-${conn.id}`}>{conn.otherFamily.name}</p>
                    <div className="mt-2">
                      <PermissionBadges permissions={conn.permissions} />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-manage-${conn.id}`}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditPermissions(conn)} data-testid={`menu-edit-permissions-${conn.id}`}>
                        <Edit className="w-4 h-4 mr-2" />Edit Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDisconnecting(conn)} className="text-red-600" data-testid={`menu-disconnect-${conn.id}`}>
                        <Trash2 className="w-4 h-4 mr-2" />Disconnect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!hasConnections && (
        <Card className="border-dashed" data-testid="card-empty-state">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Link2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg" data-testid="text-empty-title">No connections yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Connect with grandparents, co-parents, or trusted families to coordinate events, share wishlists, and stay in sync — all while keeping your private data safe.
              </p>
            </div>
            <Button onClick={() => setConnectOpen(true)} data-testid="button-empty-connect">
              <Plus className="w-4 h-4 mr-1" />Connect Your First Family
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent data-testid="dialog-connect-family">
          <DialogHeader>
            <DialogTitle>Connect with a Family</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Family Name</label>
              <Input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Enter the exact family name"
                data-testid="input-family-name"
              />
              <p className="text-xs text-muted-foreground">Enter the exact name of the family you want to connect with.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Permissions</label>
              <PermissionToggles permissions={newPermissions} onChange={setNewPermissions} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectOpen(false)} data-testid="button-cancel-connect">
              Cancel
            </Button>
            <Button
              onClick={handleSendRequest}
              disabled={createMutation.isPending}
              data-testid="button-send-request"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingConnection} onOpenChange={(open) => !open && setEditingConnection(null)}>
        <DialogContent data-testid="dialog-edit-permissions">
          <DialogHeader>
            <DialogTitle>Edit Permissions — {editingConnection?.otherFamily.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <PermissionToggles permissions={editPermissions} onChange={setEditPermissions} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingConnection(null)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={updateMutation.isPending}
              data-testid="button-save-permissions"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!disconnecting} onOpenChange={(open) => !open && setDisconnecting(null)}>
        <AlertDialogContent data-testid="dialog-disconnect-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {disconnecting?.status === "pending" ? "Cancel Request" : "Disconnect Family"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {disconnecting?.status === "pending"
                ? `Cancel your connection request to ${disconnecting?.otherFamily.name}?`
                : `Are you sure you want to disconnect from ${disconnecting?.otherFamily.name}? Shared access will be removed immediately.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-disconnect">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disconnecting && deleteMutation.mutate(disconnecting.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-disconnect"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {disconnecting?.status === "pending" ? "Cancel Request" : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
