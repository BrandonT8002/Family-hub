import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useCaregiverStatus, useCaregiverSchedule, useCaregiverNotes, useCreateCareNote, useCaregiverChecklists, useUpdateCaregiverChecklist } from "@/hooks/use-caregivers";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Baby, CalendarDays, ClipboardList, MessageSquare, Clock, Plus, ListChecks } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

const NOTE_TYPES = [
  { value: "feeding", label: "Feeding" },
  { value: "diaper", label: "Diaper Change" },
  { value: "medication", label: "Medication" },
  { value: "nap", label: "Nap Time" },
  { value: "behavioral", label: "Behavioral" },
  { value: "mood", label: "Mood" },
  { value: "general", label: "General" },
];

export default function CaregiverDashboard() {
  const { data: status, isLoading } = useCaregiverStatus();
  const { data: schedule } = useCaregiverSchedule();
  const { data: notes } = useCaregiverNotes();
  const { data: checklists } = useCaregiverChecklists();
  const updateChecklist = useUpdateCaregiverChecklist();
  const createNote = useCreateCareNote();
  const { toast } = useToast();

  const [noteType, setNoteType] = useState("general");
  const [noteContent, setNoteContent] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [showNoteForm, setShowNoteForm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!status?.isCaregiver) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No caregiver access found.</p>
      </div>
    );
  }

  const today = new Date();
  const todayStr = today.toDateString();
  const todayEvents = ((schedule as any[]) || []).filter((e: any) => {
    const eventDate = new Date(e.date).toDateString();
    return eventDate === todayStr;
  });

  const recentNotes = (notes || []).slice(0, 5);

  const handleSubmitNote = () => {
    if (!noteContent.trim()) return;
    createNote.mutate(
      {
        childId: selectedChildId ? Number(selectedChildId) : undefined,
        type: noteType,
        content: noteContent.trim(),
      },
      {
        onSuccess: () => {
          toast({ title: "Note logged", description: "Care note has been saved." });
          setNoteContent("");
          setNoteType("general");
          setShowNoteForm(false);
        },
      }
    );
  };

  const assignedChildren = status.assignedChildren || [];
  const permissions = (status.caregiver?.permissions as any) || {};

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-3xl font-display font-black tracking-tight text-slate-900" data-testid="text-caregiver-title">
          Welcome Back
        </h1>
        <p className="text-slate-500 mt-1 font-medium">
          Caring for {status.familyName}
        </p>
      </header>

      {assignedChildren.length > 0 && (
        <Card className="rounded-[2rem] border-white/80 shadow-lg bg-white/90 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-50 p-2 rounded-xl">
                <Baby className="w-5 h-5 text-blue-500" />
              </div>
              <CardTitle className="text-lg font-black">Assigned Children</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {assignedChildren.map((child: any) => (
                <Badge
                  key={child.id}
                  variant="secondary"
                  className="px-3 py-1.5 rounded-xl text-sm font-bold"
                  data-testid={`badge-child-${child.id}`}
                >
                  {child.displayName || child.user?.firstName || "Child"}
                  <span className="ml-1.5 text-xs text-gray-400 capitalize">({child.role})</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-[2rem] border-white/80 shadow-lg bg-white/90 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-purple-50 p-2 rounded-xl">
                <CalendarDays className="w-5 h-5 text-purple-500" />
              </div>
              <CardTitle className="text-lg font-black">Today's Schedule</CardTitle>
            </div>
            <Badge variant="outline" className="rounded-xl font-bold">
              {today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {todayEvents.length === 0 ? (
            <p className="text-sm text-gray-400 font-medium py-2">No events scheduled today.</p>
          ) : (
            <div className="space-y-2">
              {todayEvents.map((event: any) => (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl" data-testid={`event-${event.id}`}>
                  <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{event.title}</p>
                    {event.startTime && (
                      <p className="text-xs text-gray-400">
                        {new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(checklists || []).length > 0 && (
        <Card className="rounded-[2rem] border-white/80 shadow-lg bg-white/90 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="bg-teal-50 p-2 rounded-xl">
                <ListChecks className="w-5 h-5 text-teal-500" />
              </div>
              <CardTitle className="text-lg font-black">Checklists</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(checklists || []).map((cl: any) => {
              const items = (cl.items as Array<{ text: string; checked: boolean }>) || [];
              const checkedCount = items.filter(i => i.checked).length;
              const allDone = items.length > 0 && checkedCount === items.length;
              return (
                <div key={cl.id} className="p-4 bg-teal-50/30 rounded-2xl border border-teal-100/50" data-testid={`checklist-card-${cl.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-sm text-slate-800">{cl.title}</p>
                    <Badge variant={allDone ? "default" : "outline"} className="rounded-lg text-[10px] font-bold">
                      {checkedCount}/{items.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-3 cursor-pointer group"
                        data-testid={`checklist-item-${cl.id}-${idx}`}
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={(checked) => {
                            const updatedItems = items.map((it, i) =>
                              i === idx ? { ...it, checked: !!checked } : it
                            );
                            updateChecklist.mutate({ id: cl.id, items: updatedItems });
                          }}
                          data-testid={`checkbox-${cl.id}-${idx}`}
                        />
                        <span className={`text-sm ${item.checked ? "line-through text-slate-400" : "text-slate-700"}`}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {permissions.careNotesEnabled && (
        <Card className="rounded-[2rem] border-white/80 shadow-lg bg-white/90 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-green-50 p-2 rounded-xl">
                  <ClipboardList className="w-5 h-5 text-green-500" />
                </div>
                <CardTitle className="text-lg font-black">Care Notes</CardTitle>
              </div>
              <Button
                size="sm"
                onClick={() => setShowNoteForm(!showNoteForm)}
                className="rounded-xl font-bold h-8"
                data-testid="button-add-care-note"
              >
                <Plus className="w-4 h-4 mr-1" /> Log Note
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showNoteForm && (
              <div className="space-y-3 p-4 bg-green-50/50 rounded-2xl border border-green-100">
                {assignedChildren.length > 0 && (
                  <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                    <SelectTrigger className="rounded-xl h-10 border-green-200" data-testid="select-child">
                      <SelectValue placeholder="Select child (optional)" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {assignedChildren.map((child: any) => (
                        <SelectItem key={child.id} value={String(child.id)}>
                          {child.displayName || child.user?.firstName || "Child"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger className="rounded-xl h-10 border-green-200" data-testid="select-note-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {NOTE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="What happened? How are they doing?"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="rounded-xl border-green-200 min-h-[80px]"
                  data-testid="input-note-content"
                />

                <Button
                  onClick={handleSubmitNote}
                  disabled={!noteContent.trim() || createNote.isPending}
                  className="w-full rounded-xl h-10 font-bold"
                  data-testid="button-submit-note"
                >
                  {createNote.isPending ? "Saving..." : "Save Note"}
                </Button>
              </div>
            )}

            {recentNotes.length === 0 && !showNoteForm ? (
              <p className="text-sm text-gray-400 font-medium py-2">No care notes yet. Tap "Log Note" to get started.</p>
            ) : (
              <div className="space-y-2">
                {recentNotes.map((note: any) => {
                  const typeInfo = NOTE_TYPES.find((t) => t.value === note.type) || NOTE_TYPES[6];
                  const noteDate = new Date(note.noteTime || note.createdAt);
                  const isOld = Date.now() - noteDate.getTime() > 24 * 60 * 60 * 1000;
                  return (
                    <div key={note.id} className="p-3 bg-gray-50 rounded-xl" data-testid={`care-note-${note.id}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-600 capitalize">{typeInfo.label}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">
                          {noteDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isOld && <Badge variant="outline" className="text-[9px] px-1 py-0 rounded">Locked</Badge>}
                      </div>
                      <p className="text-sm text-gray-700">{note.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {permissions.chatEnabled && (
        <Link href="/chat">
          <Card className="rounded-[2rem] border-white/80 shadow-lg bg-white/90 backdrop-blur-xl cursor-pointer hover:shadow-xl transition-shadow" data-testid="card-contact-parent">
            <CardContent className="flex items-center gap-3 py-5">
              <div className="bg-orange-50 p-2 rounded-xl">
                <MessageSquare className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-black text-slate-800">Contact Parent</p>
                <p className="text-xs text-gray-400 font-medium">Send a message to the family</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  );
}
