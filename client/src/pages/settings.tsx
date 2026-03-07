import { useFamily, useUpdateFamily } from "@/hooks/use-family";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import {
  Paintbrush, Palette, Check, RefreshCcw, Type, UserPlus, Shield, X, Trash2, Edit2,
  Link2, Copy, Loader2, Users, Crown, ChevronUp, AlertTriangle, Settings as SettingsIcon,
  Eye, EyeOff, Lock, MessageSquare, LogOut, User, ShieldCheck, ChevronRight,
  Home, CalendarDays, Wallet, ShoppingCart, BookOpen, Target, Heart, Clock,
  GraduationCap, Dumbbell, BarChart3, ShieldOff, ClipboardList, Plus, ArrowUp, ArrowDown,
  LayoutGrid, Menu,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCaregivers, useAddCaregiver, useRevokeCaregiver, useUpdateCaregiver, useCaregiverChecklists, useCreateCaregiverChecklist, useDeleteCaregiverChecklist } from "@/hooks/use-caregivers";
import { usePreferences, useUpdatePreferences, WIDGET_LABELS, NAV_LABELS, DEFAULT_WIDGETS, DEFAULT_NAV, type WidgetPref, type NavPref } from "@/hooks/use-preferences";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { FAMILY_TIERS, ROLE_AGE_RULES } from "@shared/schema";
import type { FamilyTier } from "@shared/schema";

const FONTS = [
  { name: "Bricolage Grotesque", value: "'Bricolage Grotesque', sans-serif" },
  { name: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', sans-serif" },
  { name: "Inter", value: "'Inter', sans-serif" },
  { name: "Poppins", value: "'Poppins', sans-serif" },
  { name: "Outfit", value: "'Outfit', sans-serif" },
  { name: "Montserrat", value: "'Montserrat', sans-serif" },
];

const DEFAULT_THEME = {
  home: "#e8ecf1", schedule: "#e2e7ef", money: "#e5e9f0", groceries: "#dfe5ed",
  chat: "#e0e6ee", diary: "#e6eaf0", goals: "#e1e7ee", wishlists: "#e4e8f0", leaveTime: "#e2e8ef"
};

const THEME_PRESETS = [
  { name: "Slate & Steel", description: "Modern and sophisticated", colors: DEFAULT_THEME },
  { name: "Warm Clay", description: "Rich earth tones", colors: { home: "#ede5db", schedule: "#e8ddd0", money: "#ebdfd3", groceries: "#e5d8ca", chat: "#e6dacf", diary: "#ead9cb", goals: "#e3d8cc", wishlists: "#ece0d5", leaveTime: "#e7dbd0" } },
  { name: "Deep Ocean", description: "Bold blues and teals", colors: { home: "#dbe8ef", schedule: "#d4e2ed", money: "#dce6ec", groceries: "#d1e1ea", chat: "#cde0ea", diary: "#dde7ed", goals: "#d0dfe8", wishlists: "#d8e4ec", leaveTime: "#d2e2ea" } },
  { name: "Royal Plum", description: "Rich purple depth", colors: { home: "#e8e0f0", schedule: "#e2daea", money: "#ebe0ec", groceries: "#e0d8e6", chat: "#ddd6e8", diary: "#e6deec", goals: "#dfd8e5", wishlists: "#e9e0ee", leaveTime: "#e1dbe9" } },
  { name: "Evergreen", description: "Deep forest vibes", colors: { home: "#dae8e0", schedule: "#d3e2da", money: "#e0e2d8", groceries: "#cfe0d6", chat: "#ccddd4", diary: "#dfe0d3", goals: "#cdddd5", wishlists: "#dde0d4", leaveTime: "#d0e0d7" } },
  { name: "Monochrome", description: "Clean and minimal", colors: { home: "#eaebec", schedule: "#e4e5e7", money: "#e2e3e5", groceries: "#dfe0e2", chat: "#e1e2e4", diary: "#e3e4e6", goals: "#e0e1e3", wishlists: "#e2e3e5", leaveTime: "#e4e5e7" } },
  { name: "Deep Night", description: "Dark and refined", colors: { home: "#1a1d23", schedule: "#1e2128", money: "#21242b", groceries: "#1d2027", chat: "#1b1f25", diary: "#201f24", goals: "#1c2122", wishlists: "#211e24", leaveTime: "#1b2120" } },
];

const SECTIONS = [
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme, fonts & colors" },
  { id: "personalize", label: "Personalize", icon: LayoutGrid, description: "Dashboard & menu layout" },
  { id: "family", label: "Family", icon: Users, description: "Members, plan & invites" },
  { id: "permissions", label: "Permissions", icon: ShieldCheck, description: "Role-based access" },
  { id: "connections", label: "Connections", icon: Link2, description: "Linked families" },
  { id: "privacy", label: "Chat & Privacy", icon: Lock, description: "Blocks & privacy rules" },
  { id: "caregivers", label: "Caregivers", icon: Shield, description: "Trusted helpers" },
  { id: "account", label: "Account", icon: User, description: "Profile & logout" },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

export default function Settings() {
  const { data: family } = useFamily();
  const { user } = useAuth();
  const isOwner = family && user && family.ownerId === user.id;
  const [activeSection, setActiveSection] = useState<SectionId>("appearance");

  return (
    <div className="pb-32">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-primary/10 p-2.5 rounded-2xl">
            <SettingsIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black tracking-tight text-slate-900" data-testid="text-settings-title">Settings</h1>
            <p className="text-sm text-slate-500 font-medium">Control center for your family's digital home.</p>
          </div>
        </div>
      </header>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 -mx-1 px-1 scrollbar-hide">
        {SECTIONS.map((section) => {
          const active = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                active
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-white/80 text-slate-600 border border-slate-100 hover:bg-slate-50"
              }`}
              data-testid={`tab-${section.id}`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[60vh]">
        {activeSection === "appearance" && <AppearanceSection />}
        {activeSection === "personalize" && <PersonalizationSection />}
        {activeSection === "family" && isOwner && <FamilySection family={family} />}
        {activeSection === "family" && !isOwner && (
          <Card className="rounded-[2rem] border-0 shadow-sm bg-white/90">
            <CardContent className="py-12 text-center">
              <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-500">Only the family owner can manage members and plans.</p>
            </CardContent>
          </Card>
        )}
        {activeSection === "permissions" && <PermissionsSection />}
        {activeSection === "connections" && <ConnectionsSection />}
        {activeSection === "privacy" && <PrivacySection />}
        {activeSection === "caregivers" && isOwner && <CaregiversSection familyId={family!.id} />}
        {activeSection === "caregivers" && !isOwner && (
          <Card className="rounded-[2rem] border-0 shadow-sm bg-white/90">
            <CardContent className="py-12 text-center">
              <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-500">Only the family owner can manage caregivers.</p>
            </CardContent>
          </Card>
        )}
        {activeSection === "account" && <AccountSection />}
      </div>
    </div>
  );
}

function AppearanceSection() {
  const { data: family } = useFamily();
  const updateFamily = useUpdateFamily();
  const { toast } = useToast();
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [fontFamily, setFontFamily] = useState("'Bricolage Grotesque', sans-serif");
  const [showColors, setShowColors] = useState(false);

  useEffect(() => {
    if (family?.themeConfig) setTheme(family.themeConfig as typeof DEFAULT_THEME);
    if (family?.fontFamily) setFontFamily(family.fontFamily);
  }, [family]);

  const handleSave = () => {
    updateFamily.mutate({ themeConfig: theme, fontFamily }, {
      onSuccess: () => toast({ title: "Settings saved!", description: "Your family space has been updated." }),
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<Palette className="w-5 h-5 text-violet-500" />}
        title="Appearance"
        description="Personalize how your family's digital home looks and feels."
        accent="bg-violet-50"
      />

      <Card className="rounded-[2rem] border-0 shadow-sm bg-white/90">
        <CardContent className="pt-6 space-y-6">
          <div>
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
              <Type className="w-4 h-4 text-primary" /> Typography
            </label>
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 font-bold" data-testid="select-font">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {FONTS.map((font) => (
                  <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>{font.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
              <Paintbrush className="w-4 h-4 text-indigo-500" /> Theme Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {THEME_PRESETS.map((preset) => {
                const isActive = JSON.stringify(theme) === JSON.stringify(preset.colors);
                return (
                  <button
                    key={preset.name}
                    onClick={() => setTheme(preset.colors)}
                    data-testid={`button-theme-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`p-3 rounded-2xl border-2 transition-all text-left ${isActive ? 'border-primary/50 bg-primary/5 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  >
                    <div className="flex gap-0.5 mb-2">
                      {Object.values(preset.colors).slice(0, 5).map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-lg border border-white shadow-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <p className={`font-bold text-xs ${isActive ? 'text-primary' : 'text-slate-700'}`}>{preset.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{preset.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <button
              onClick={() => setShowColors(!showColors)}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary transition-colors"
              data-testid="button-toggle-colors"
            >
              <Palette className="w-4 h-4" />
              Custom Module Colors
              <ChevronRight className={`w-4 h-4 transition-transform ${showColors ? 'rotate-90' : ''}`} />
            </button>
            {showColors && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {Object.entries(theme).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: value }} />
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-bold text-slate-600 capitalize block">{key.replace(/([A-Z])/g, ' $1')}</label>
                      <Input
                        type="color"
                        value={value}
                        onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                        className="h-8 rounded-lg cursor-pointer border-slate-100 p-0.5 w-full"
                        data-testid={`input-color-${key}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
            <p className="text-xs font-bold text-slate-500 mb-2">Preview</p>
            <div className="h-20 rounded-xl border-2 border-white shadow-inner overflow-hidden flex items-center justify-center" style={{ backgroundColor: theme.home }}>
              <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow text-center" style={{ fontFamily }}>
                <p className="font-bold text-sm text-slate-800">Dashboard</p>
                <p className="text-[10px] text-slate-500">Live preview</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={updateFamily.isPending} className="flex-1 rounded-2xl h-12 font-bold" data-testid="button-save-appearance">
              <Check className="w-4 h-4 mr-2" /> Save Changes
            </Button>
            <Button variant="outline" onClick={() => { setTheme(DEFAULT_THEME); setFontFamily("'Bricolage Grotesque', sans-serif"); }} className="rounded-2xl h-12 font-bold border-slate-100" data-testid="button-reset-appearance">
              <RefreshCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PersonalizationSection() {
  const { widgets, navItems } = usePreferences();
  const updatePrefs = useUpdatePreferences();
  const [localWidgets, setLocalWidgets] = useState<WidgetPref[]>([]);
  const [localNav, setLocalNav] = useState<NavPref[]>([]);

  useEffect(() => {
    setLocalWidgets(widgets);
  }, [JSON.stringify(widgets)]);

  useEffect(() => {
    setLocalNav(navItems);
  }, [JSON.stringify(navItems)]);

  const toggleWidget = (key: string) => {
    setLocalWidgets(prev => prev.map(w => w.key === key ? { ...w, enabled: !w.enabled } : w));
  };

  const moveWidget = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= localWidgets.length) return;
    const copy = [...localWidgets];
    [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
    setLocalWidgets(copy.map((w, i) => ({ ...w, order: i })));
  };

  const toggleNav = (key: string) => {
    setLocalNav(prev => prev.map(n => n.key === key ? { ...n, enabled: !n.enabled } : n));
  };

  const moveNav = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= localNav.length) return;
    const copy = [...localNav];
    [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
    setLocalNav(copy.map((n, i) => ({ ...n, order: i })));
  };

  const handleSave = () => {
    updatePrefs.mutate({ dashboardWidgets: localWidgets, navOrder: localNav });
  };

  const handleReset = () => {
    setLocalWidgets(DEFAULT_WIDGETS);
    setLocalNav(DEFAULT_NAV);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<LayoutGrid className="w-5 h-5 text-indigo-500" />}
        title="Personalize"
        description="Choose what appears on your dashboard and arrange your menu."
        accent="bg-indigo-50"
      />

      <Card className="rounded-[2rem] border-0 shadow-sm bg-white/90">
        <CardContent className="pt-6 space-y-5">
          <div>
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
              <LayoutGrid className="w-4 h-4 text-indigo-500" /> Dashboard Widgets
            </label>
            <p className="text-xs text-slate-400 mb-3">Toggle widgets on/off and reorder them. Drag them up or down to change their position on your home screen.</p>
            <div className="space-y-1.5">
              {localWidgets.map((w, idx) => (
                <div key={w.key} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${w.enabled ? 'bg-indigo-50/50' : 'bg-slate-50/50 opacity-60'}`}>
                  <Switch
                    checked={w.enabled}
                    onCheckedChange={() => toggleWidget(w.key)}
                    data-testid={`toggle-widget-${w.key}`}
                  />
                  <span className="flex-1 text-sm font-semibold text-slate-700">{WIDGET_LABELS[w.key] || w.key}</span>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => moveWidget(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-all"
                      data-testid={`button-widget-up-${w.key}`}
                    >
                      <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <button
                      onClick={() => moveWidget(idx, 1)}
                      disabled={idx === localWidgets.length - 1}
                      className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-all"
                      data-testid={`button-widget-down-${w.key}`}
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
              <Menu className="w-4 h-4 text-indigo-500" /> Menu Items
            </label>
            <p className="text-xs text-slate-400 mb-3">Show or hide items in the More menu and arrange them by importance.</p>
            <div className="space-y-1.5">
              {localNav.map((n, idx) => (
                <div key={n.key} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${n.enabled ? 'bg-indigo-50/50' : 'bg-slate-50/50 opacity-60'}`}>
                  <Switch
                    checked={n.enabled}
                    onCheckedChange={() => toggleNav(n.key)}
                    data-testid={`toggle-nav-${n.key}`}
                  />
                  <span className="flex-1 text-sm font-semibold text-slate-700">{NAV_LABELS[n.key] || n.key}</span>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => moveNav(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-all"
                      data-testid={`button-nav-up-${n.key}`}
                    >
                      <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <button
                      onClick={() => moveNav(idx, 1)}
                      disabled={idx === localNav.length - 1}
                      className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-all"
                      data-testid={`button-nav-down-${n.key}`}
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={updatePrefs.isPending} className="flex-1 rounded-2xl h-12 font-bold" data-testid="button-save-personalization">
              <Check className="w-4 h-4 mr-2" /> Save Layout
            </Button>
            <Button variant="outline" onClick={handleReset} className="rounded-2xl h-12 font-bold border-slate-100" data-testid="button-reset-personalization">
              <RefreshCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FamilySection({ family }: { family: any }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const updateFamily = useUpdateFamily();
  const { data: members, isLoading: membersLoading } = useQuery({ queryKey: ['/api/family/members'] });
  const { data: invites } = useQuery({ queryKey: ['/api/family-invites'] });
  const { data: caregiversList } = useCaregivers();

  const [editingName, setEditingName] = useState(false);
  const [familyName, setFamilyName] = useState(family?.name || "");
  const [inviteRole, setInviteRole] = useState("Adult");
  const [inviteName, setInviteName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => { if (family?.name) setFamilyName(family.name); }, [family]);

  const tier = ((family as any).tier || "core") as FamilyTier;
  const tierConfig = FAMILY_TIERS[tier] || FAMILY_TIERS.core;
  const memberCount = (members as any[])?.length || 0;
  const activeCaregiverCount = (caregiversList || []).filter((c: any) => c.status !== "revoked").length;
  const atMemberCapacity = memberCount >= tierConfig.maxMembers;

  const createInvite = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/family-invites", {
        role: inviteRole,
        displayName: inviteName.trim() || undefined,
        expiresInDays: expiresInDays === "never" ? undefined : Number(expiresInDays),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/family-invites'] });
      setInviteName("");
      setShowInviteForm(false);
      toast({ title: "Invite link created!" });
    },
    onError: () => toast({ title: "Failed to create invite", variant: "destructive" }),
  });

  const revokeInvite = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/family-invites/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/family-invites'] }); toast({ title: "Invite revoked" }); },
  });

  const removeMember = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/family/members/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/family/members'] }); toast({ title: "Member removed" }); },
    onError: () => toast({ title: "Failed to remove member", variant: "destructive" }),
  });

  const updateTier = useMutation({
    mutationFn: async (newTier: string) => { const res = await apiRequest("PATCH", "/api/family/tier", { tier: newTier }); return res.json(); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/family'] }); toast({ title: "Plan updated!" }); },
    onError: (err: any) => toast({ title: "Cannot change plan", description: err.message, variant: "destructive" }),
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: number; isAdmin: boolean }) => {
      await apiRequest("PATCH", `/api/family/members/${id}/admin`, { isTemporaryAdmin: isAdmin });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/family/members'] }); toast({ title: "Admin status updated" }); },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const saveFamilyName = () => {
    if (!familyName.trim()) return;
    updateFamily.mutate({ name: familyName.trim() }, {
      onSuccess: () => { setEditingName(false); toast({ title: "Family name updated" }); },
    });
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${token}`);
    toast({ title: "Link copied!" });
  };

  const roleColor = (role: string) => {
    const colors: Record<string, string> = {
      Owner: "bg-amber-50 text-amber-700 border-amber-200",
      Adult: "bg-blue-50 text-blue-700 border-blue-200",
      Teen: "bg-violet-50 text-violet-700 border-violet-200",
      Youth: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Child: "bg-pink-50 text-pink-700 border-pink-200",
    };
    return colors[role] || "bg-slate-50 text-slate-700 border-slate-200";
  };

  const activeInvites = (invites as any[])?.filter((i: any) => i.status === "pending") || [];
  const usedInvites = (invites as any[])?.filter((i: any) => i.status !== "pending") || [];

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<Users className="w-5 h-5 text-blue-500" />}
        title="Family"
        description="Manage your household — members, plans, and invitations."
        accent="bg-blue-50"
      />

      <Card className="rounded-[2rem] border-0 shadow-sm bg-white/90">
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Family Name</p>
              {editingName ? (
                <div className="flex gap-2 mt-1">
                  <Input value={familyName} onChange={(e) => setFamilyName(e.target.value)} className="rounded-xl h-9 w-48" data-testid="input-family-name" />
                  <Button size="sm" onClick={saveFamilyName} className="rounded-xl h-9" data-testid="button-save-name"><Check className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingName(false)} className="rounded-xl h-9"><X className="w-3.5 h-3.5" /></Button>
                </div>
              ) : (
                <button onClick={() => setEditingName(true)} className="text-lg font-black text-slate-800 hover:text-primary transition-colors flex items-center gap-2" data-testid="button-edit-name">
                  {family.name} <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Family Plan</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{tierConfig.label}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500">{memberCount} / {tierConfig.maxMembers} members</p>
                <p className="text-xs font-bold text-slate-400">{activeCaregiverCount} / {tierConfig.maxCaregivers} caregivers</p>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
              <div className={`h-full rounded-full transition-all ${atMemberCapacity ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (memberCount / tierConfig.maxMembers) * 100)}%` }} />
            </div>
            <div className="flex gap-2">
              {(Object.keys(FAMILY_TIERS) as FamilyTier[]).map((t) => (
                <button
                  key={t}
                  onClick={() => updateTier.mutate(t)}
                  disabled={t === tier || updateTier.isPending}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all ${t === tier ? "border-blue-400 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                  data-testid={`button-tier-${t}`}
                >
                  {FAMILY_TIERS[t].label}
                  <span className="block text-[10px] font-medium mt-0.5 opacity-70">{FAMILY_TIERS[t].maxMembers} members</span>
                </button>
              ))}
            </div>
          </div>

          {atMemberCapacity && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800" data-testid="alert-at-capacity">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-xs font-bold">You've reached your member limit. Upgrade your plan or remove a member to add someone new.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-0 shadow-sm bg-white/90">
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-slate-700">Members</p>
            <Button
              onClick={() => setShowInviteForm(!showInviteForm)}
              disabled={atMemberCapacity}
              size="sm"
              className="rounded-xl font-bold"
              data-testid="button-add-member"
            >
              {showInviteForm ? <X className="w-3.5 h-3.5 mr-1" /> : <UserPlus className="w-3.5 h-3.5 mr-1" />}
              {showInviteForm ? "Cancel" : "Add Member"}
            </Button>
          </div>

          {showInviteForm && !atMemberCapacity && (
            <div className="space-y-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <p className="font-bold text-slate-800 text-sm">Invite New Member</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Name (optional)</label>
                  <Input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="e.g. Mom, Dad" className="rounded-xl h-9" data-testid="input-member-name" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Role</label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="rounded-xl h-9" data-testid="select-member-role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Adult">Adult (18+)</SelectItem>
                      <SelectItem value="Teen">Teen (15–17)</SelectItem>
                      <SelectItem value="Youth">Youth (13–14)</SelectItem>
                      <SelectItem value="Child">Child (12 and under)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Expires</label>
                  <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                    <SelectTrigger className="rounded-xl h-9" data-testid="select-invite-expiry"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                {inviteRole === "Adult" && "Adults have full privacy — personal diary, schedule, goals, and financial entries."}
                {inviteRole === "Teen" && "Teens have high autonomy with limited financial visibility. Owner cannot read their diary."}
                {inviteRole === "Youth" && "Youth members have moderate autonomy. Owner controls sharing and messaging."}
                {inviteRole === "Child" && "Children have a simplified, owner-controlled environment."}
              </p>
              <Button onClick={() => createInvite.mutate()} disabled={createInvite.isPending} className="rounded-xl font-bold" data-testid="button-generate-invite">
                {createInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
                Generate Invite Link
              </Button>
            </div>
          )}

          {membersLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : (
            <div className="space-y-2">
              {(members as any[])?.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100" data-testid={`member-row-${member.id}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                      {member.user?.firstName?.[0] || member.displayName?.[0] || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" data-testid={`text-member-name-${member.id}`}>
                        {member.displayName || `${member.user?.firstName || ""} ${member.user?.lastName || ""}`.trim() || "Unknown"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {member.role === "Owner" && <Crown className="w-3 h-3 text-amber-500" />}
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-md border ${roleColor(member.role)}`}>{member.role}</Badge>
                        {member.isTemporaryAdmin && <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-md border-orange-200 bg-orange-50 text-orange-600">Admin</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {member.role === "Adult" && member.role !== "Owner" && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400">Admin</span>
                        <Switch
                          checked={!!member.isTemporaryAdmin}
                          onCheckedChange={(checked) => toggleAdmin.mutate({ id: member.id, isAdmin: checked })}
                          data-testid={`switch-admin-${member.id}`}
                        />
                      </div>
                    )}
                    {member.role !== "Owner" && (
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => { if (confirm(`Remove ${member.displayName || member.user?.firstName}?`)) removeMember.mutate(member.id); }}
                        className="text-red-400 hover:text-red-600 rounded-xl h-8 px-2"
                        data-testid={`button-remove-member-${member.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeInvites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Invites</p>
              {activeInvites.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50" data-testid={`invite-row-${inv.id}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate">{inv.displayName || "Unnamed"}</p>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${roleColor(inv.role)}`}>{inv.role}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{inv.expiresAt ? `Expires ${format(new Date(inv.expiresAt), 'MMM d')}` : "No expiration"}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0 ml-2">
                    <Button variant="outline" size="sm" onClick={() => copyLink(inv.token)} className="rounded-lg h-8" data-testid={`button-copy-invite-${inv.id}`}>
                      <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => revokeInvite.mutate(inv.id)} className="rounded-lg h-8 text-red-400" data-testid={`button-revoke-invite-${inv.id}`}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {usedInvites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Past Invites</p>
              {usedInvites.slice(0, 5).map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 opacity-60">
                  <p className="text-sm font-medium truncate">{inv.displayName || "Unnamed"}</p>
                  <Badge variant={inv.status === "used" ? "default" : "destructive"} className="text-[10px]">{inv.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PermissionsSection() {
  const modules = [
    { key: "schedule", label: "Schedule", icon: CalendarDays },
    { key: "money", label: "Money", icon: Wallet },
    { key: "groceries", label: "Shopping", icon: ShoppingCart },
    { key: "chat", label: "Chat", icon: MessageSquare },
    { key: "diary", label: "Diary", icon: BookOpen },
    { key: "goals", label: "Goals", icon: Target },
    { key: "wishlists", label: "Wishlists", icon: Heart },
    { key: "leaveTime", label: "Leave Time", icon: Clock },
    { key: "academics", label: "Academics", icon: GraduationCap },
    { key: "workouts", label: "Workouts", icon: Dumbbell },
    { key: "connections", label: "Connections", icon: Link2 },
    { key: "snapshots", label: "Snapshots", icon: BarChart3 },
  ];

  const roles = [
    { key: "Owner", label: "Owner", description: "Full control of family structure and settings", color: "text-amber-600 bg-amber-50" },
    { key: "TempAdmin", label: "Temp Admin", description: "Limited owner powers, cannot alter ownership", color: "text-orange-600 bg-orange-50" },
    { key: "Adult", label: "Adult (18+)", description: "Full personal privacy, cannot access others' private data", color: "text-blue-600 bg-blue-50" },
    { key: "Teen", label: "Teen (15–17)", description: "Expanded autonomy, diary protected, messaging controlled", color: "text-violet-600 bg-violet-50" },
    { key: "Youth", label: "Youth (13–14)", description: "Owner approval required, controlled visibility", color: "text-emerald-600 bg-emerald-50" },
    { key: "Child", label: "Child (≤12)", description: "Owner manages notifications, limited sharing", color: "text-pink-600 bg-pink-50" },
    { key: "Caregiver", label: "Caregiver", description: "Limited to care notes, schedule, and parent messaging", color: "text-teal-600 bg-teal-50" },
  ];

  type Access = "full" | "view" | "controlled" | "none";

  const matrix: Record<string, Record<string, Access>> = {
    Owner:     { schedule: "full", money: "full", groceries: "full", chat: "full", diary: "full", goals: "full", wishlists: "full", leaveTime: "full", academics: "full", workouts: "full", connections: "full", snapshots: "full" },
    TempAdmin: { schedule: "full", money: "full", groceries: "full", chat: "full", diary: "full", goals: "full", wishlists: "full", leaveTime: "full", academics: "full", workouts: "full", connections: "view", snapshots: "full" },
    Adult:     { schedule: "full", money: "full", groceries: "full", chat: "full", diary: "full", goals: "full", wishlists: "full", leaveTime: "full", academics: "full", workouts: "full", connections: "view", snapshots: "full" },
    Teen:      { schedule: "full", money: "view", groceries: "full", chat: "controlled", diary: "full", goals: "full", wishlists: "full", leaveTime: "full", academics: "full", workouts: "full", connections: "none", snapshots: "view" },
    Youth:     { schedule: "controlled", money: "none", groceries: "view", chat: "controlled", diary: "full", goals: "full", wishlists: "full", leaveTime: "controlled", academics: "full", workouts: "full", connections: "none", snapshots: "none" },
    Child:     { schedule: "view", money: "none", groceries: "view", chat: "controlled", diary: "controlled", goals: "controlled", wishlists: "view", leaveTime: "none", academics: "view", workouts: "controlled", connections: "none", snapshots: "none" },
    Caregiver: { schedule: "controlled", money: "none", groceries: "none", chat: "controlled", diary: "none", goals: "none", wishlists: "none", leaveTime: "none", academics: "none", workouts: "none", connections: "none", snapshots: "none" },
  };

  const accessLabel = (a: Access) => {
    switch (a) {
      case "full": return { text: "Full", color: "bg-emerald-100 text-emerald-700" };
      case "view": return { text: "View", color: "bg-blue-100 text-blue-700" };
      case "controlled": return { text: "Limited", color: "bg-amber-100 text-amber-700" };
      case "none": return { text: "—", color: "bg-slate-100 text-slate-400" };
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
        title="Permissions"
        description="How access works across roles. This is the backbone of your family's privacy."
        accent="bg-emerald-50"
      />

      <div className="space-y-3">
        {roles.map((role) => (
          <Card key={role.key} className="rounded-2xl border-0 shadow-sm bg-white/90 overflow-hidden" data-testid={`card-role-${role.key}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`px-3 py-1.5 rounded-xl font-bold text-xs ${role.color}`}>{role.label}</div>
                <p className="text-xs text-slate-500 flex-1">{role.description}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {modules.map((mod) => {
                  const access = matrix[role.key]?.[mod.key] || "none";
                  const { text, color } = accessLabel(access);
                  return (
                    <div key={mod.key} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${color}`} data-testid={`perm-${role.key}-${mod.key}`}>
                      <mod.icon className="w-3 h-3" />
                      {mod.label}: {text}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-0 shadow-sm bg-blue-50/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-700">Privacy First</p>
              <p className="text-xs text-slate-500 mt-1">
                Even as the Owner, you cannot read other members' private diaries, view their private chats, or monitor who they're messaging. 
                Each role is designed to protect autonomy while maintaining family coordination.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConnectionsSection() {
  const { toast } = useToast();
  const { data: connections, isLoading } = useQuery({ queryKey: ['/api/family-connections'] });

  const [showConnect, setShowConnect] = useState(false);
  const [targetName, setTargetName] = useState("");
  const [perms, setPerms] = useState({ sharedEvents: true, sharedWishlists: false, chat: false, careNotes: false });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPerms, setEditPerms] = useState({ sharedEvents: true, sharedWishlists: false, chat: false, careNotes: false });

  const qc = useQueryClient();

  const createConnection = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/family-connections", { targetFamilyName: targetName.trim(), permissions: perms });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/family-connections'] });
      setShowConnect(false);
      setTargetName("");
      toast({ title: "Connection request sent!" });
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const updateConnection = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PATCH", `/api/family-connections/${id}`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/family-connections'] });
      setEditingId(null);
      toast({ title: "Connection updated" });
    },
  });

  const deleteConnection = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/family-connections/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/family-connections'] }); toast({ title: "Connection removed" }); },
  });

  const active = ((connections as any[]) || []).filter((c: any) => c.status === "active");
  const pendingSent = ((connections as any[]) || []).filter((c: any) => c.status === "pending" && c.direction === "sent");
  const pendingReceived = ((connections as any[]) || []).filter((c: any) => c.status === "pending" && c.direction === "received");

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<Link2 className="w-5 h-5 text-cyan-500" />}
        title="Family Connections"
        description="Connect with other families for coordination — holiday planning, gift sharing, event scheduling — without sharing private data."
        accent="bg-cyan-50"
      />

      <Card className="rounded-[2rem] border-0 shadow-sm bg-white/90">
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-slate-700">Connected Families</p>
            <Button size="sm" onClick={() => setShowConnect(!showConnect)} className="rounded-xl font-bold" data-testid="button-connect-family">
              {showConnect ? <X className="w-3.5 h-3.5 mr-1" /> : <UserPlus className="w-3.5 h-3.5 mr-1" />}
              {showConnect ? "Cancel" : "Connect"}
            </Button>
          </div>

          {showConnect && (
            <div className="space-y-4 p-4 bg-cyan-50/50 rounded-2xl border border-cyan-100">
              <Input value={targetName} onChange={(e) => setTargetName(e.target.value)} placeholder="Enter family name" className="rounded-xl" data-testid="input-family-name-connect" />
              <div className="space-y-2">
                {[
                  { key: "sharedEvents", label: "Shared Events" },
                  { key: "sharedWishlists", label: "Shared Wishlists" },
                  { key: "chat", label: "Cross-family Chat" },
                  { key: "careNotes", label: "Care Notes" },
                ].map((p) => (
                  <div key={p.key} className="flex items-center justify-between py-1">
                    <span className="text-xs font-bold text-slate-600">{p.label}</span>
                    <Switch checked={(perms as any)[p.key]} onCheckedChange={(v) => setPerms({ ...perms, [p.key]: v })} data-testid={`switch-perm-${p.key}`} />
                  </div>
                ))}
              </div>
              <Button onClick={() => createConnection.mutate()} disabled={!targetName.trim() || createConnection.isPending} className="rounded-xl font-bold w-full" data-testid="button-send-request">
                {createConnection.isPending ? "Sending..." : "Send Request"}
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : (
            <>
              {pendingReceived.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-500">Incoming Requests</p>
                  {pendingReceived.map((conn: any) => (
                    <div key={conn.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-100" data-testid={`conn-incoming-${conn.id}`}>
                      <p className="text-sm font-bold">{conn.otherFamily?.name || "Unknown"}</p>
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => updateConnection.mutate({ id: conn.id, data: { status: "active" } })} className="rounded-lg h-8" data-testid={`button-accept-${conn.id}`}>Accept</Button>
                        <Button size="sm" variant="ghost" onClick={() => updateConnection.mutate({ id: conn.id, data: { status: "declined" } })} className="rounded-lg h-8 text-red-500" data-testid={`button-decline-${conn.id}`}>Decline</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pendingSent.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Requests</p>
                  {pendingSent.map((conn: any) => (
                    <div key={conn.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100" data-testid={`conn-pending-${conn.id}`}>
                      <div>
                        <p className="text-sm font-bold">{conn.otherFamily?.name || "Unknown"}</p>
                        <Badge variant="outline" className="text-[10px] mt-1">Pending</Badge>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => deleteConnection.mutate(conn.id)} className="rounded-lg h-8 text-red-400" data-testid={`button-cancel-${conn.id}`}><X className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                </div>
              )}

              {active.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Connections</p>
                  {active.map((conn: any) => {
                    const isEditingThis = editingId === conn.id;
                    const connPerms = (conn.permissions as any) || {};
                    return (
                      <div key={conn.id} className="p-3 rounded-xl bg-slate-50/50 border border-slate-100" data-testid={`conn-active-${conn.id}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold">{conn.otherFamily?.name || "Unknown"}</p>
                            <div className="flex gap-1 mt-1">
                              {connPerms.sharedEvents && <Badge variant="outline" className="text-[9px] rounded-lg">Events</Badge>}
                              {connPerms.sharedWishlists && <Badge variant="outline" className="text-[9px] rounded-lg">Wishlists</Badge>}
                              {connPerms.chat && <Badge variant="outline" className="text-[9px] rounded-lg">Chat</Badge>}
                              {connPerms.careNotes && <Badge variant="outline" className="text-[9px] rounded-lg">Notes</Badge>}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { if (isEditingThis) { setEditingId(null); } else { setEditingId(conn.id); setEditPerms(connPerms); } }} className="rounded-xl h-8 px-2" data-testid={`button-edit-conn-${conn.id}`}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { if (confirm("Remove this connection?")) deleteConnection.mutate(conn.id); }} className="text-red-400 rounded-xl h-8 px-2" data-testid={`button-disconnect-${conn.id}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        {isEditingThis && (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                            {[
                              { key: "sharedEvents", label: "Shared Events" },
                              { key: "sharedWishlists", label: "Shared Wishlists" },
                              { key: "chat", label: "Cross-family Chat" },
                              { key: "careNotes", label: "Care Notes" },
                            ].map((p) => (
                              <div key={p.key} className="flex items-center justify-between py-1">
                                <span className="text-xs font-bold text-slate-600">{p.label}</span>
                                <Switch checked={(editPerms as any)[p.key]} onCheckedChange={(v) => setEditPerms({ ...editPerms, [p.key]: v })} />
                              </div>
                            ))}
                            <Button size="sm" onClick={() => updateConnection.mutate({ id: conn.id, data: { permissions: editPerms } })} className="rounded-xl font-bold w-full mt-2" data-testid={`button-save-conn-${conn.id}`}>
                              Save Permissions
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : !pendingSent.length && !pendingReceived.length && (
                <div className="text-center py-8">
                  <div className="bg-slate-100 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">No connections yet</p>
                  <p className="text-xs text-slate-400 mt-1">Connect with another family to coordinate schedules, gifts, and more.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PrivacySection() {
  const { data: blocksList } = useQuery({ queryKey: ['/api/blocks'] });
  const { data: members } = useQuery({ queryKey: ['/api/family/members'] });
  const { toast } = useToast();
  const qc = useQueryClient();

  const unblock = useMutation({
    mutationFn: async (blockedId: string) => { await apiRequest("DELETE", `/api/blocks/${blockedId}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/blocks'] }); toast({ title: "User unblocked" }); },
  });

  const getMemberName = (userId: string) => {
    const member = (members as any[])?.find((m: any) => m.userId === userId);
    return member?.displayName || member?.user?.firstName || `User ${userId.slice(0, 6)}`;
  };

  const privacyRules = [
    { icon: EyeOff, title: "Private chats stay private", description: "The owner cannot see private conversations between other members, or who is messaging whom." },
    { icon: Check, title: "Message requests required", description: "New conversations require acceptance before messages can be exchanged freely." },
    { icon: Lock, title: "Take Space without judgment", description: "Any member can mute a conversation without the other person being notified. Just breathing room." },
    { icon: Shield, title: "Blocking is immediate", description: "When you block someone, they can no longer send you messages. You can unblock at any time." },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<Lock className="w-5 h-5 text-rose-500" />}
        title="Chat & Privacy"
        description="Your family's communication is built on trust, not surveillance."
        accent="bg-rose-50"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {privacyRules.map((rule, i) => (
          <Card key={i} className="rounded-2xl border-0 shadow-sm bg-white/90">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="bg-rose-50 p-2 rounded-xl shrink-0">
                  <rule.icon className="w-4 h-4 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{rule.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{rule.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[2rem] border-0 shadow-sm bg-white/90">
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm font-black text-slate-700">Blocked Users</p>
          {!(blocksList as any[])?.length ? (
            <div className="text-center py-6">
              <ShieldOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">No blocked users</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(blocksList as any[]).map((block: any) => (
                <div key={block.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100" data-testid={`block-row-${block.id}`}>
                  <div>
                    <p className="text-sm font-bold">{getMemberName(block.blockedId)}</p>
                    <p className="text-xs text-slate-400">Blocked {block.createdAt ? format(new Date(block.createdAt), 'MMM d, yyyy') : ''}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => unblock.mutate(block.blockedId)} className="rounded-xl h-8" data-testid={`button-unblock-${block.id}`}>
                    <ShieldOff className="w-3.5 h-3.5 mr-1" /> Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CaregiversSection({ familyId }: { familyId: number }) {
  const { data: caregiversList, isLoading } = useCaregivers();
  const addCaregiver = useAddCaregiver();
  const revokeCaregiver = useRevokeCaregiver();
  const updateCaregiver = useUpdateCaregiver();
  const { data: checklists } = useCaregiverChecklists();
  const createChecklist = useCreateCaregiverChecklist();
  const deleteChecklist = useDeleteCaregiverChecklist();
  const { toast } = useToast();
  const { data: members } = useQuery({ queryKey: ["/api/family/members"] });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [checklistTitle, setChecklistTitle] = useState("");
  const [checklistCaregiverId, setChecklistCaregiverId] = useState("");
  const [checklistItems, setChecklistItems] = useState<string[]>([""]);
  const [cgUserId, setCgUserId] = useState("");
  const [cgDisplayName, setCgDisplayName] = useState("");
  const [cgAccessType, setCgAccessType] = useState("ongoing");
  const [cgAssignedChildren, setCgAssignedChildren] = useState<number[]>([]);
  const [cgScheduleAccess, setCgScheduleAccess] = useState("shared_events");
  const [cgChatEnabled, setCgChatEnabled] = useState(true);
  const [cgCareNotesEnabled, setCgCareNotesEnabled] = useState(true);

  const childMembers = ((members as any[]) || []).filter((m: any) => ["Child", "Youth", "Teen"].includes(m.role));

  const handleAdd = () => {
    if (!cgUserId.trim()) { toast({ title: "User ID required", variant: "destructive" }); return; }
    addCaregiver.mutate({
      caregiverUserId: cgUserId.trim(),
      displayName: cgDisplayName.trim() || undefined,
      accessType: cgAccessType,
      assignedChildIds: cgAssignedChildren,
      permissions: { scheduleAccess: cgScheduleAccess, chatEnabled: cgChatEnabled, careNotesEnabled: cgCareNotesEnabled, mediaUpload: false },
    }, {
      onSuccess: () => { toast({ title: "Caregiver added" }); setShowAddForm(false); setCgUserId(""); setCgDisplayName(""); setCgAssignedChildren([]); },
      onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
    });
  };

  const startEdit = (cg: any) => {
    const perms = (cg.permissions as any) || {};
    setEditingId(cg.id);
    setCgAccessType(cg.accessType || "ongoing");
    setCgAssignedChildren((cg.assignedChildIds as number[]) || []);
    setCgScheduleAccess(perms.scheduleAccess || "shared_events");
    setCgChatEnabled(perms.chatEnabled ?? true);
    setCgCareNotesEnabled(perms.careNotesEnabled ?? true);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updateCaregiver.mutate({ id: editingId, accessType: cgAccessType, assignedChildIds: cgAssignedChildren, permissions: { scheduleAccess: cgScheduleAccess, chatEnabled: cgChatEnabled, careNotesEnabled: cgCareNotesEnabled, mediaUpload: false } }, {
      onSuccess: () => { toast({ title: "Caregiver updated" }); setEditingId(null); },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  };

  const activeCaregivers = (caregiversList || []).filter((c: any) => c.status !== "revoked");
  const revokedCaregivers = (caregiversList || []).filter((c: any) => c.status === "revoked");

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<Shield className="w-5 h-5 text-teal-500" />}
        title="Caregivers"
        description="Manage trusted helpers — babysitters, nannies, grandparents — with limited, permission-based access."
        accent="bg-teal-50"
      />

      <Card className="rounded-[2rem] border-0 shadow-sm bg-white/90">
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-slate-700">Trusted Helpers</p>
            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="rounded-xl font-bold" data-testid="button-add-caregiver">
              {showAddForm ? <X className="w-3.5 h-3.5 mr-1" /> : <UserPlus className="w-3.5 h-3.5 mr-1" />}
              {showAddForm ? "Cancel" : "Add Caregiver"}
            </Button>
          </div>

          {showAddForm && (
            <div className="space-y-4 p-4 bg-teal-50/50 rounded-2xl border border-teal-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">User ID</label>
                  <Input placeholder="e.g. 12345678" value={cgUserId} onChange={(e) => setCgUserId(e.target.value)} className="rounded-xl h-9" data-testid="input-caregiver-userid" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Display Name</label>
                  <Input placeholder="e.g. Sarah (Nanny)" value={cgDisplayName} onChange={(e) => setCgDisplayName(e.target.value)} className="rounded-xl h-9" data-testid="input-caregiver-name" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Access Duration</label>
                <Select value={cgAccessType} onValueChange={setCgAccessType}>
                  <SelectTrigger className="rounded-xl h-9" data-testid="select-access-type"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="one-day">One Day</SelectItem>
                    <SelectItem value="weekend">Weekend</SelectItem>
                    <SelectItem value="weekly">Weekly (Recurring)</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {childMembers.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Assigned Children</label>
                  <div className="flex flex-wrap gap-2">
                    {childMembers.map((child: any) => {
                      const selected = cgAssignedChildren.includes(child.id);
                      return (
                        <button key={child.id} onClick={() => setCgAssignedChildren(selected ? cgAssignedChildren.filter(id => id !== child.id) : [...cgAssignedChildren, child.id])}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${selected ? "border-teal-400 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-600"}`}
                          data-testid={`button-assign-child-${child.id}`}
                        >{child.displayName || child.user?.firstName || "Child"}</button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Schedule Access</label>
                <Select value={cgScheduleAccess} onValueChange={setCgScheduleAccess}>
                  <SelectTrigger className="rounded-xl h-9" data-testid="select-schedule-access"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="assigned_only">Assigned events only</SelectItem>
                    <SelectItem value="child_schedule">Child's schedule</SelectItem>
                    <SelectItem value="shared_events">Shared family events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between py-1">
                <label className="text-xs font-bold text-slate-600">Can message parents</label>
                <Switch checked={cgChatEnabled} onCheckedChange={setCgChatEnabled} data-testid="switch-chat" />
              </div>
              <div className="flex items-center justify-between py-1">
                <label className="text-xs font-bold text-slate-600">Can log care notes</label>
                <Switch checked={cgCareNotesEnabled} onCheckedChange={setCgCareNotesEnabled} data-testid="switch-care-notes" />
              </div>
              <Button onClick={handleAdd} disabled={addCaregiver.isPending} className="w-full rounded-xl font-bold" data-testid="button-confirm-add-caregiver">
                {addCaregiver.isPending ? "Adding..." : "Add Caregiver"}
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : activeCaregivers.length === 0 && !showAddForm ? (
            <div className="text-center py-8">
              <div className="bg-slate-100 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-500">No caregivers yet</p>
              <p className="text-xs text-slate-400 mt-1">Add a babysitter, nanny, or trusted helper.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCaregivers.map((cg: any) => {
                const perms = (cg.permissions as any) || {};
                const isEditing = editingId === cg.id;
                return (
                  <div key={cg.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100" data-testid={`caregiver-${cg.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-sm text-slate-800">{cg.displayName || `User ${cg.userId}`}</p>
                        <div className="flex gap-1.5 mt-1">
                          <Badge variant={cg.status === "active" ? "default" : "secondary"} className="text-[10px] px-2 py-0 rounded-lg capitalize">{cg.status}</Badge>
                          <Badge variant="outline" className="text-[10px] px-2 py-0 rounded-lg capitalize">{cg.accessType}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => isEditing ? setEditingId(null) : startEdit(cg)} className="rounded-xl h-8 px-2" data-testid={`button-edit-${cg.id}`}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { if (confirm(`Revoke ${cg.displayName}?`)) revokeCaregiver.mutate(cg.id, { onSuccess: () => toast({ title: "Access revoked" }) }); }}
                          className="text-red-400 rounded-xl h-8 px-2" data-testid={`button-revoke-${cg.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="space-y-3 mt-3 pt-3 border-t border-slate-100">
                        <Select value={cgAccessType} onValueChange={setCgAccessType}>
                          <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="one-day">One Day</SelectItem>
                            <SelectItem value="weekend">Weekend</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="ongoing">Ongoing</SelectItem>
                          </SelectContent>
                        </Select>
                        {childMembers.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {childMembers.map((child: any) => {
                              const selected = cgAssignedChildren.includes(child.id);
                              return (
                                <button key={child.id} onClick={() => setCgAssignedChildren(selected ? cgAssignedChildren.filter(id => id !== child.id) : [...cgAssignedChildren, child.id])}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${selected ? "border-teal-400 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-600"}`}
                                >{child.displayName || child.user?.firstName || "Child"}</button>
                              );
                            })}
                          </div>
                        )}
                        <Select value={cgScheduleAccess} onValueChange={setCgScheduleAccess}>
                          <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="assigned_only">Assigned events only</SelectItem>
                            <SelectItem value="child_schedule">Child's schedule</SelectItem>
                            <SelectItem value="shared_events">Shared family events</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs font-bold text-slate-600">Chat</span>
                          <Switch checked={cgChatEnabled} onCheckedChange={setCgChatEnabled} />
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs font-bold text-slate-600">Care Notes</span>
                          <Switch checked={cgCareNotesEnabled} onCheckedChange={setCgCareNotesEnabled} />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveEdit} disabled={updateCaregiver.isPending} className="rounded-xl font-bold flex-1" data-testid="button-save-edit">Save</Button>
                          <Button variant="outline" onClick={() => setEditingId(null)} className="rounded-xl">Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {perms.chatEnabled && <Badge variant="outline" className="text-[9px] rounded-lg">Chat</Badge>}
                        {perms.careNotesEnabled && <Badge variant="outline" className="text-[9px] rounded-lg">Care Notes</Badge>}
                        <Badge variant="outline" className="text-[9px] rounded-lg capitalize">{(perms.scheduleAccess || "").replace(/_/g, " ")}</Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {revokedCaregivers.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Previously Revoked</p>
              {revokedCaregivers.map((cg: any) => (
                <div key={cg.id} className="p-3 bg-slate-50 rounded-xl opacity-60 mb-1">
                  <p className="text-sm font-bold text-slate-500">{cg.displayName || `User ${cg.userId}`}</p>
                  <Badge variant="secondary" className="text-[9px] mt-1">Revoked</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {activeCaregivers.length > 0 && (
        <Card className="rounded-[2rem] border-0 shadow-sm bg-white/90">
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-teal-500" />
                <p className="text-sm font-black text-slate-700">Shared Checklists</p>
              </div>
              <Button size="sm" onClick={() => setShowChecklistForm(!showChecklistForm)} className="rounded-xl font-bold" data-testid="button-add-checklist">
                {showChecklistForm ? <X className="w-3.5 h-3.5 mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                {showChecklistForm ? "Cancel" : "New Checklist"}
              </Button>
            </div>

            {showChecklistForm && (
              <div className="space-y-3 p-4 bg-teal-50/50 rounded-2xl border border-teal-100">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Checklist Title</label>
                  <Input
                    placeholder="e.g. Bedtime Routine"
                    value={checklistTitle}
                    onChange={(e) => setChecklistTitle(e.target.value)}
                    className="rounded-xl h-9"
                    data-testid="input-checklist-title"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Assign to Caregiver</label>
                  <Select value={checklistCaregiverId} onValueChange={setChecklistCaregiverId}>
                    <SelectTrigger className="rounded-xl h-9" data-testid="select-checklist-caregiver">
                      <SelectValue placeholder="Select caregiver" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {activeCaregivers.map((cg: any) => (
                        <SelectItem key={cg.id} value={String(cg.id)}>
                          {cg.displayName || `User ${cg.userId}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Items</label>
                  <div className="space-y-2">
                    {checklistItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => {
                            const updated = [...checklistItems];
                            updated[idx] = e.target.value;
                            setChecklistItems(updated);
                          }}
                          placeholder={`Item ${idx + 1}`}
                          className="rounded-xl h-9 flex-1"
                          data-testid={`input-checklist-item-${idx}`}
                        />
                        {checklistItems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== idx))}
                            data-testid={`button-remove-item-${idx}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChecklistItems([...checklistItems, ""])}
                      className="rounded-xl font-bold text-xs"
                      data-testid="button-add-checklist-item"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Item
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (!checklistTitle.trim() || !checklistCaregiverId) {
                      toast({ title: "Title and caregiver required", variant: "destructive" });
                      return;
                    }
                    const items = checklistItems.filter(i => i.trim()).map(text => ({ text: text.trim(), checked: false }));
                    if (items.length === 0) {
                      toast({ title: "Add at least one item", variant: "destructive" });
                      return;
                    }
                    createChecklist.mutate(
                      { title: checklistTitle.trim(), caregiverId: Number(checklistCaregiverId), items },
                      {
                        onSuccess: () => {
                          toast({ title: "Checklist created" });
                          setShowChecklistForm(false);
                          setChecklistTitle("");
                          setChecklistCaregiverId("");
                          setChecklistItems([""]);
                        },
                        onError: () => toast({ title: "Failed to create checklist", variant: "destructive" }),
                      }
                    );
                  }}
                  disabled={createChecklist.isPending}
                  className="w-full rounded-xl font-bold"
                  data-testid="button-save-checklist"
                >
                  {createChecklist.isPending ? "Creating..." : "Create Checklist"}
                </Button>
              </div>
            )}

            {(checklists || []).length === 0 && !showChecklistForm ? (
              <div className="text-center py-6">
                <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">No checklists yet</p>
                <p className="text-xs text-slate-400 mt-1">Create a checklist for caregivers to follow.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(checklists || []).map((cl: any) => {
                  const caregiver = activeCaregivers.find((c: any) => c.id === cl.caregiverId);
                  const items = (cl.items as Array<{ text: string; checked: boolean }>) || [];
                  const checkedCount = items.filter(i => i.checked).length;
                  return (
                    <div key={cl.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100" data-testid={`checklist-${cl.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-sm text-slate-800">{cl.title}</p>
                          <p className="text-xs text-slate-400">
                            For: {caregiver?.displayName || "Caregiver"}
                            {" "}&middot;{" "}
                            {checkedCount}/{items.length} done
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this checklist?")) {
                              deleteChecklist.mutate(cl.id, {
                                onSuccess: () => toast({ title: "Checklist deleted" }),
                              });
                            }
                          }}
                          data-testid={`button-delete-checklist-${cl.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            {item.checked ? (
                              <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded border border-slate-300 shrink-0" />
                            )}
                            <span className={item.checked ? "line-through text-slate-400" : "text-slate-700"}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AccountSection() {
  const { user, logout } = useAuth();
  const { data: family } = useFamily();

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<User className="w-5 h-5 text-slate-500" />}
        title="Account"
        description="Your profile and session."
        accent="bg-slate-100"
      />

      <Card className="rounded-[2rem] border-0 shadow-sm bg-white/90">
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-black text-primary">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <p className="text-xl font-black text-slate-800" data-testid="text-account-name">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              {user?.createdAt && (
                <p className="text-xs text-slate-400 mt-0.5">Member since {format(new Date(user.createdAt), 'MMMM yyyy')}</p>
              )}
            </div>
          </div>

          {family && (
            <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Family</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-black text-slate-800">{family.name}</p>
                  <p className="text-xs text-slate-500">{FAMILY_TIERS[(family as any).tier as FamilyTier]?.label || "Core"} Plan</p>
                </div>
                {family.ownerId === user?.id && (
                  <Badge className="bg-amber-50 text-amber-700 border border-amber-200">
                    <Crown className="w-3 h-3 mr-1" /> Owner
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => logout()}
            className="w-full rounded-2xl h-12 font-bold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SectionHeader({ icon, title, description, accent }: { icon: any; title: string; description: string; accent: string }) {
  return (
    <div className="flex items-start gap-3 mb-2">
      <div className={`${accent} p-2.5 rounded-2xl shrink-0`}>{icon}</div>
      <div>
        <h2 className="text-xl font-black text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
