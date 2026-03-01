import { useState, useEffect, useMemo } from "react";
import {
  useLeaveTimeSettings,
  useLeaveTimeToday,
  useLeaveTimeTemplates,
  useSaveLeaveTimeSettings,
  useSaveLeaveTimeOverride,
  useDeleteLeaveTimeOverride,
  useCreateLeaveTimeTemplate,
  useDeleteLeaveTimeTemplate,
} from "@/hooks/use-leave-time";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Clock,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
  Eye,
  EyeOff,
  SkipForward,
  Save,
  ListChecks,
  FileText,
  CalendarClock,
} from "lucide-react";
import { motion } from "framer-motion";

const DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const DEFAULT_CHECKLIST_ITEMS = [
  "Keys", "Wallet", "Phone", "ID", "Lunch", "Work bag",
];

const SUGGESTED_ITEMS = [
  "Keys", "Wallet", "Phone", "ID", "Insurance card", "Lunch",
  "Homework", "Work bag", "Gym clothes", "Medication", "Glasses",
  "Charger", "Water bottle", "Umbrella", "Mask", "Snacks",
];

export default function LeaveTime() {
  const { data: settings, isLoading } = useLeaveTimeSettings();
  const { data: todayData } = useLeaveTimeToday();
  const { data: templates = [] } = useLeaveTimeTemplates();
  const saveSettings = useSaveLeaveTimeSettings();
  const saveOverride = useSaveLeaveTimeOverride();
  const deleteOverride = useDeleteLeaveTimeOverride();
  const createTemplate = useCreateLeaveTimeTemplate();
  const deleteTemplate = useDeleteLeaveTimeTemplate();
  const { toast } = useToast();

  const [isEnabled, setIsEnabled] = useState(true);
  const [schedule, setSchedule] = useState<Record<string, string | null>>({
    mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null,
  });
  const [reminderMinutes, setReminderMinutes] = useState(10);
  const [visibility, setVisibility] = useState("private");
  const [showOnDashboard, setShowOnDashboard] = useState(true);
  const [checklistEnabled, setChecklistEnabled] = useState(true);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideTime, setOverrideTime] = useState("");

  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateItems, setTemplateItems] = useState<string[]>([]);
  const [templateNewItem, setTemplateNewItem] = useState("");

  useEffect(() => {
    if (settings) {
      setIsEnabled(settings.isEnabled ?? true);
      setSchedule((settings.schedule as any) || { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null });
      setReminderMinutes(settings.reminderMinutes ?? 10);
      setVisibility(settings.visibility ?? "private");
      setShowOnDashboard(settings.showOnDashboard ?? true);
      setChecklistEnabled(settings.checklistEnabled ?? true);
      setChecklist(settings.defaultChecklist || []);
    }
  }, [settings]);

  const markChanged = () => setHasChanges(true);

  const handleSave = () => {
    saveSettings.mutate({
      isEnabled,
      schedule,
      reminderMinutes,
      visibility,
      showOnDashboard,
      checklistEnabled,
      defaultChecklist: checklist,
    }, {
      onSuccess: () => {
        setHasChanges(false);
        toast({ title: "Leave time saved" });
      },
      onError: () => toast({ title: "Failed to save", variant: "destructive" }),
    });
  };

  const handleSetAllWeekdays = (time: string) => {
    const newSched = { ...schedule, mon: time, tue: time, wed: time, thu: time, fri: time };
    setSchedule(newSched);
    markChanged();
  };

  const handleSetAll = (time: string) => {
    const newSched: Record<string, string | null> = {};
    DAYS.forEach(d => { newSched[d.key] = time; });
    setSchedule(newSched);
    markChanged();
  };

  const addChecklistItem = (item: string) => {
    if (!item.trim() || checklist.includes(item.trim())) return;
    setChecklist([...checklist, item.trim()]);
    setNewItem("");
    markChanged();
  };

  const removeChecklistItem = (item: string) => {
    setChecklist(checklist.filter(i => i !== item));
    markChanged();
  };

  const today = new Date().toISOString().split('T')[0];

  const handleOverride = () => {
    if (!overrideTime) return;
    saveOverride.mutate({ date: today, leaveTime: overrideTime }, {
      onSuccess: () => { setOverrideOpen(false); toast({ title: "Today's time updated" }); },
      onError: () => toast({ title: "Failed to override", variant: "destructive" }),
    });
  };

  const handleSkipToday = () => {
    saveOverride.mutate({ date: today, isSkipped: true }, {
      onSuccess: () => toast({ title: "Skipping today" }),
      onError: () => toast({ title: "Failed to skip", variant: "destructive" }),
    });
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim() || templateItems.length === 0) return;
    createTemplate.mutate({ name: templateName, items: templateItems }, {
      onSuccess: () => {
        setTemplateOpen(false);
        setTemplateName("");
        setTemplateItems([]);
        toast({ title: "Template saved" });
      },
      onError: () => toast({ title: "Failed to save template", variant: "destructive" }),
    });
  };

  const loadTemplate = (items: string[]) => {
    setChecklist(items);
    markChanged();
    toast({ title: "Template loaded into checklist" });
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-leave-time-title">
            <div className="p-2.5 bg-emerald-100 rounded-2xl">
              <Clock className="w-6 h-6 text-emerald-600" />
            </div>
            Leave Time
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Set your walk-out time and never forget essentials.</p>
        </div>
      </div>

      {todayData?.hasLeaveTime && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-emerald-50 border-emerald-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-xl">
                    <CalendarClock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Today's Walk-Out</p>
                    <p className="text-2xl font-bold text-emerald-800" data-testid="text-today-leave-time">{todayData.leaveTime}</p>
                  </div>
                  {todayData.isOverride && (
                    <Badge className="bg-emerald-200 text-emerald-800 text-xs">Override</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setOverrideTime(todayData.leaveTime); setOverrideOpen(true); }} className="text-xs" data-testid="button-change-today">
                    Change
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleSkipToday} className="text-xs text-muted-foreground" data-testid="button-skip-today">
                    <SkipForward className="w-3 h-3 mr-1" />Skip
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {todayData?.noTimeSet && !todayData?.hasLeaveTime && (
        <Card className="bg-amber-50 border-amber-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-800">What time are you planning on walking out today?</p>
              <p className="text-xs text-amber-600 mt-0.5">No time set for today</p>
            </div>
            <Button size="sm" onClick={() => setOverrideOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white" data-testid="button-set-today">
              Set Time
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Schedule</CardTitle>
            <Switch checked={isEnabled} onCheckedChange={v => { setIsEnabled(v); markChanged(); }} data-testid="switch-enable-leave-time" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => {
              const t = schedule.mon || "07:45";
              handleSetAllWeekdays(t);
            }} className="text-xs" data-testid="button-set-weekdays">
              Same Weekdays
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              const t = schedule.mon || "07:45";
              handleSetAll(t);
            }} className="text-xs" data-testid="button-set-everyday">
              Same Every Day
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {DAYS.map(day => (
              <div key={day.key} className="text-center space-y-1.5">
                <p className="text-xs font-bold text-muted-foreground uppercase">{day.label}</p>
                <Input
                  type="time"
                  value={schedule[day.key] || ""}
                  onChange={e => {
                    setSchedule({ ...schedule, [day.key]: e.target.value || null });
                    markChanged();
                  }}
                  className="text-xs h-9 text-center px-1 rounded-xl"
                  data-testid={`input-time-${day.key}`}
                />
                {schedule[day.key] && (
                  <button
                    onClick={() => { setSchedule({ ...schedule, [day.key]: null }); markChanged(); }}
                    className="text-[10px] text-red-400 hover:text-red-500"
                  >
                    Clear
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Reminder</label>
              <Select value={String(reminderMinutes)} onValueChange={v => { setReminderMinutes(Number(v)); markChanged(); }}>
                <SelectTrigger className="h-9 text-sm rounded-xl" data-testid="select-reminder"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 min before</SelectItem>
                  <SelectItem value="10">10 min before</SelectItem>
                  <SelectItem value="15">15 min before</SelectItem>
                  <SelectItem value="20">20 min before</SelectItem>
                  <SelectItem value="30">30 min before</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Visibility</label>
              <Select value={visibility} onValueChange={v => { setVisibility(v); markChanged(); }}>
                <SelectTrigger className="h-9 text-sm rounded-xl" data-testid="select-visibility"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="private"><span className="flex items-center gap-1"><EyeOff className="w-3 h-3" />Private</span></SelectItem>
                  <SelectItem value="family"><span className="flex items-center gap-1"><Eye className="w-3 h-3" />Family</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl">
            <div>
              <p className="text-sm font-medium">Show on Dashboard</p>
              <p className="text-xs text-muted-foreground">Display countdown on your home screen</p>
            </div>
            <Switch checked={showOnDashboard} onCheckedChange={v => { setShowOnDashboard(v); markChanged(); }} data-testid="switch-dashboard" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ListChecks className="w-5 h-5" /> Pre-Leave Checklist
            </CardTitle>
            <Switch checked={checklistEnabled} onCheckedChange={v => { setChecklistEnabled(v); markChanged(); }} data-testid="switch-checklist" />
          </div>
        </CardHeader>
        {checklistEnabled && (
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {checklist.map(item => (
                <Badge key={item} variant="secondary" className="gap-1 py-1 px-2.5 text-sm">
                  {item}
                  <button onClick={() => removeChecklistItem(item)} className="ml-0.5 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addChecklistItem(newItem)}
                placeholder="Add item..."
                className="h-9 rounded-xl text-sm"
                data-testid="input-checklist-item"
              />
              <Button size="sm" onClick={() => addChecklistItem(newItem)} className="rounded-xl" data-testid="button-add-checklist">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Quick Add</p>
              <div className="flex flex-wrap gap-1">
                {SUGGESTED_ITEMS.filter(s => !checklist.includes(s)).map(s => (
                  <button
                    key={s}
                    onClick={() => addChecklistItem(s)}
                    className="text-xs bg-muted/50 hover:bg-muted px-2.5 py-1 rounded-lg transition-colors"
                    data-testid={`suggest-${s.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {templates.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Saved Templates</p>
                <div className="space-y-2">
                  {(templates as any[]).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between bg-muted/30 p-2.5 rounded-xl">
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.items?.join(", ")}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => loadTemplate(t.items)} className="text-xs h-7" data-testid={`load-template-${t.id}`}>
                          Use
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteTemplate.mutate(t.id)} className="text-xs h-7 text-red-400" data-testid={`delete-template-${t.id}`}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button size="sm" variant="outline" onClick={() => { setTemplateItems([...checklist]); setTemplateName(""); setTemplateOpen(true); }} className="text-xs" data-testid="button-save-template">
              <FileText className="w-3 h-3 mr-1" /> Save as Template
            </Button>
          </CardContent>
        )}
      </Card>

      {hasChanges && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="sticky bottom-24 z-20">
          <Button onClick={handleSave} disabled={saveSettings.isPending} className="w-full h-12 rounded-2xl font-bold shadow-lg" data-testid="button-save-settings">
            {saveSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </motion.div>
      )}

      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Today's Walk-Out Time</DialogTitle>
            <DialogDescription>Set or change your departure time for today only.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="time"
              value={overrideTime}
              onChange={e => setOverrideTime(e.target.value)}
              className="h-14 text-2xl text-center rounded-2xl"
              data-testid="input-override-time"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideOpen(false)}>Cancel</Button>
            <Button onClick={handleOverride} disabled={saveOverride.isPending} data-testid="button-confirm-override">
              {saveOverride.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Set Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Checklist Template</DialogTitle>
            <DialogDescription>Save your current checklist as a reusable template.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Template name (e.g. Doctor Visit)" className="rounded-xl" data-testid="input-template-name" />
            <div className="flex flex-wrap gap-1.5">
              {templateItems.map(item => (
                <Badge key={item} variant="secondary" className="gap-1 py-1 px-2">
                  {item}
                  <button onClick={() => setTemplateItems(templateItems.filter(i => i !== item))}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={templateNewItem} onChange={e => setTemplateNewItem(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && templateNewItem.trim()) { setTemplateItems([...templateItems, templateNewItem.trim()]); setTemplateNewItem(""); }}} placeholder="Add item..." className="h-8 text-sm rounded-xl" />
              <Button size="sm" onClick={() => { if (templateNewItem.trim()) { setTemplateItems([...templateItems, templateNewItem.trim()]); setTemplateNewItem(""); }}} className="h-8">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate} disabled={createTemplate.isPending} data-testid="button-confirm-template">
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
