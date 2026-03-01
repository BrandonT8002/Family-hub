import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCaregiverStatus, useCaregiverNotes, useCreateCareNote, useCareNotes } from "@/hooks/use-caregivers";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, ClipboardList, Filter } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFamily } from "@/hooks/use-family";

const NOTE_TYPES = [
  { value: "feeding", label: "Feeding", emoji: "🍼" },
  { value: "diaper", label: "Diaper Change", emoji: "👶" },
  { value: "medication", label: "Medication", emoji: "💊" },
  { value: "nap", label: "Nap Time", emoji: "😴" },
  { value: "behavioral", label: "Behavioral", emoji: "📋" },
  { value: "mood", label: "Mood", emoji: "😊" },
  { value: "general", label: "General", emoji: "📝" },
];

export default function CareNotesPage() {
  const { data: status } = useCaregiverStatus();
  const { data: family } = useFamily();
  const isCaregiver = status?.isCaregiver;

  const { data: caregiverNotes, isLoading: cgLoading } = useCaregiverNotes();
  const [selectedChildFilter, setSelectedChildFilter] = useState<string>("all");
  const { data: parentNotes, isLoading: parentLoading } = useCareNotes(
    !isCaregiver ? (selectedChildFilter !== "all" ? Number(selectedChildFilter) : undefined) : undefined
  );

  const createNote = useCreateCareNote();
  const { toast } = useToast();

  const [noteType, setNoteType] = useState("general");
  const [noteContent, setNoteContent] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  const notes = isCaregiver ? caregiverNotes : parentNotes;
  const loading = isCaregiver ? cgLoading : parentLoading;
  const assignedChildren = status?.assignedChildren || [];

  const handleSubmitNote = () => {
    if (!noteContent.trim()) return;
    createNote.mutate(
      { childId: selectedChildId ? Number(selectedChildId) : undefined, type: noteType, content: noteContent.trim() },
      {
        onSuccess: () => {
          toast({ title: "Note logged", description: "Care note saved successfully." });
          setNoteContent("");
          setNoteType("general");
          setShowForm(false);
        },
      }
    );
  };

  const groupByDate = (items: any[]) => {
    const groups: Record<string, any[]> = {};
    items.forEach((note) => {
      const date = new Date(note.noteTime || note.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(note);
    });
    return groups;
  };

  const grouped = groupByDate(notes || []);

  return (
    <div className="space-y-6 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-slate-900" data-testid="text-care-notes-title">
            Care Notes
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            {isCaregiver ? "Log and review care activities" : "View caregiver activity logs"}
          </p>
        </div>
        {isCaregiver && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl font-bold"
            data-testid="button-new-note"
          >
            <Plus className="w-4 h-4 mr-1" /> New Note
          </Button>
        )}
      </header>

      {isCaregiver && showForm && (
        <Card className="rounded-[2rem] border-white/80 shadow-lg bg-white/90 backdrop-blur-xl">
          <CardContent className="space-y-3 pt-5">
            {assignedChildren.length > 0 && (
              <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                <SelectTrigger className="rounded-xl h-10" data-testid="select-note-child">
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

            <div className="grid grid-cols-4 gap-2">
              {NOTE_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setNoteType(t.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all ${
                    noteType === t.value ? "bg-primary/10 border-2 border-primary/30" : "bg-gray-50 border-2 border-transparent"
                  }`}
                  data-testid={`button-type-${t.value}`}
                >
                  <span className="text-lg">{t.emoji}</span>
                  <span className="text-[10px] font-bold text-gray-600">{t.label}</span>
                </button>
              ))}
            </div>

            <Textarea
              placeholder="What happened? Details, observations..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="rounded-xl min-h-[100px]"
              data-testid="input-note-content"
            />

            <div className="flex gap-2">
              <Button
                onClick={handleSubmitNote}
                disabled={!noteContent.trim() || createNote.isPending}
                className="flex-1 rounded-xl font-bold"
                data-testid="button-save-note"
              >
                {createNote.isPending ? "Saving..." : "Save Note"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isCaregiver && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select value={selectedChildFilter} onValueChange={setSelectedChildFilter}>
            <SelectTrigger className="rounded-xl h-9 w-48" data-testid="select-filter-child">
              <SelectValue placeholder="All children" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All children</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="rounded-[2rem] border-white/80 shadow-lg bg-white/90 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="bg-gray-100 p-3 rounded-2xl">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-bold">No care notes yet</p>
            <p className="text-sm text-gray-400">
              {isCaregiver ? 'Tap "New Note" to start logging activities.' : "Care notes will appear here once caregivers start logging."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayNotes]) => (
            <div key={date}>
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3 ml-1">{date}</h3>
              <div className="space-y-2">
                {dayNotes.map((note: any) => {
                  const typeInfo = NOTE_TYPES.find((t) => t.value === note.type) || NOTE_TYPES[6];
                  const noteDate = new Date(note.noteTime || note.createdAt);
                  const isOld = Date.now() - noteDate.getTime() > 24 * 60 * 60 * 1000;
                  return (
                    <Card key={note.id} className="rounded-2xl border-white/80 bg-white/90 backdrop-blur-xl" data-testid={`note-${note.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{typeInfo.emoji}</span>
                          <span className="text-sm font-bold text-gray-700">{typeInfo.label}</span>
                          {isOld && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-lg ml-1">
                              Locked
                            </Badge>
                          )}
                          <span className="text-xs text-gray-400 ml-auto">
                            {noteDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
