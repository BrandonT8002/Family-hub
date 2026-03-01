import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Plus, Loader2, ChevronDown, ChevronUp, Trash2, Edit, MoreVertical, BookOpen } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { AcademicClass, AcademicEntry } from "@shared/schema";

type FilterTab = "all" | "mine";

function computeAverage(entries: AcademicEntry[]): string | null {
  const scored = entries.filter(e => e.score != null && e.maxScore != null && parseFloat(e.maxScore) > 0);
  if (scored.length === 0) return null;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const entry of scored) {
    const score = parseFloat(entry.score!);
    const max = parseFloat(entry.maxScore!);
    const weight = entry.weight ? parseFloat(entry.weight) : 1;
    totalWeightedScore += (score / max) * 100 * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return null;
  return (totalWeightedScore / totalWeight).toFixed(1);
}

function getLetterGrade(avg: number): string {
  if (avg >= 93) return "A";
  if (avg >= 90) return "A-";
  if (avg >= 87) return "B+";
  if (avg >= 83) return "B";
  if (avg >= 80) return "B-";
  if (avg >= 77) return "C+";
  if (avg >= 73) return "C";
  if (avg >= 70) return "C-";
  if (avg >= 67) return "D+";
  if (avg >= 63) return "D";
  if (avg >= 60) return "D-";
  return "F";
}

function typeBadgeVariant(type: string): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "test": return "destructive";
    case "quiz": return "default";
    case "project": return "secondary";
    default: return "outline";
  }
}

function ClassEntries({ classItem }: { classItem: AcademicClass }) {
  const { toast } = useToast();
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AcademicEntry | null>(null);
  const [entryForm, setEntryForm] = useState({
    title: "", type: "assignment", score: "", maxScore: "", weight: "", notes: "",
  });

  const { data: entries = [], isLoading } = useQuery<AcademicEntry[]>({
    queryKey: ["/api/academics/classes", classItem.id, "entries"],
  });

  const createEntry = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await apiRequest("POST", `/api/academics/classes/${classItem.id}/entries`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academics/classes", classItem.id, "entries"] });
      toast({ title: "Entry added" });
      setEntryDialogOpen(false);
      resetEntryForm();
    },
    onError: () => toast({ title: "Failed to add entry", variant: "destructive" }),
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown> & { id: number }) => {
      await apiRequest("PATCH", `/api/academics/entries/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academics/classes", classItem.id, "entries"] });
      toast({ title: "Entry updated" });
      setEntryDialogOpen(false);
      setEditingEntry(null);
      resetEntryForm();
    },
    onError: () => toast({ title: "Failed to update entry", variant: "destructive" }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/academics/entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academics/classes", classItem.id, "entries"] });
      toast({ title: "Entry deleted" });
    },
    onError: () => toast({ title: "Failed to delete entry", variant: "destructive" }),
  });

  const resetEntryForm = () => setEntryForm({ title: "", type: "assignment", score: "", maxScore: "", weight: "", notes: "" });

  const handleEntrySubmit = () => {
    if (!entryForm.title.trim()) {
      toast({ title: "Please enter a title", variant: "destructive" });
      return;
    }
    const data: Record<string, unknown> = {
      title: entryForm.title.trim(),
      type: entryForm.type,
      score: entryForm.score || null,
      maxScore: entryForm.maxScore || null,
      weight: entryForm.weight || null,
      notes: entryForm.notes || null,
    };
    if (editingEntry) {
      updateEntry.mutate({ id: editingEntry.id, ...data });
    } else {
      createEntry.mutate(data);
    }
  };

  const handleEditEntry = (entry: AcademicEntry) => {
    setEditingEntry(entry);
    setEntryForm({
      title: entry.title,
      type: entry.type,
      score: entry.score || "",
      maxScore: entry.maxScore || "",
      weight: entry.weight || "",
      notes: entry.notes || "",
    });
    setEntryDialogOpen(true);
  };

  const avg = computeAverage(entries);

  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin mx-auto my-2" data-testid="loader-entries" />;

  return (
    <div className="space-y-3 pt-2 border-t">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {avg !== null && (
          <div className="flex items-center gap-2" data-testid={`text-class-average-${classItem.id}`}>
            <span className="text-sm text-muted-foreground">Average:</span>
            <Badge variant="secondary">{avg}% ({getLetterGrade(parseFloat(avg))})</Badge>
          </div>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => { resetEntryForm(); setEditingEntry(null); setEntryDialogOpen(true); }}
          data-testid={`button-add-entry-${classItem.id}`}
        >
          <Plus className="w-4 h-4 mr-1" />Add Entry
        </Button>
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4" data-testid={`text-no-entries-${classItem.id}`}>
          No entries yet. Add your first assignment or test.
        </p>
      )}

      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/30"
          data-testid={`entry-row-${entry.id}`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
            <Badge variant={typeBadgeVariant(entry.type)} className="text-xs" data-testid={`badge-type-${entry.id}`}>
              {entry.type}
            </Badge>
            <span className="text-sm font-medium truncate" data-testid={`text-entry-title-${entry.id}`}>{entry.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {entry.score != null && entry.maxScore != null && (
              <span className="text-sm text-muted-foreground" data-testid={`text-entry-score-${entry.id}`}>
                {entry.score}/{entry.maxScore}
              </span>
            )}
            {entry.date && (
              <span className="text-xs text-muted-foreground hidden sm:inline" data-testid={`text-entry-date-${entry.id}`}>
                {new Date(entry.date).toLocaleDateString()}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid={`menu-entry-${entry.id}`}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditEntry(entry)} data-testid={`edit-entry-${entry.id}`}>
                  <Edit className="w-4 h-4 mr-2" />Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => deleteEntry.mutate(entry.id)} className="text-red-600" data-testid={`delete-entry-${entry.id}`}>
                  <Trash2 className="w-4 h-4 mr-2" />Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}

      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Entry" : "Add Entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={entryForm.title}
                onChange={(e) => setEntryForm({ ...entryForm, title: e.target.value })}
                placeholder="e.g., Chapter 5 Test"
                data-testid="input-entry-title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={entryForm.type} onValueChange={(v) => setEntryForm({ ...entryForm, type: v })}>
                <SelectTrigger data-testid="select-entry-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="homework">Homework</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Score</label>
                <Input
                  value={entryForm.score}
                  onChange={(e) => setEntryForm({ ...entryForm, score: e.target.value })}
                  placeholder="e.g., 85"
                  data-testid="input-entry-score"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Score</label>
                <Input
                  value={entryForm.maxScore}
                  onChange={(e) => setEntryForm({ ...entryForm, maxScore: e.target.value })}
                  placeholder="e.g., 100"
                  data-testid="input-entry-max-score"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Weight</label>
              <Input
                value={entryForm.weight}
                onChange={(e) => setEntryForm({ ...entryForm, weight: e.target.value })}
                placeholder="e.g., 1.0"
                data-testid="input-entry-weight"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={entryForm.notes}
                onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
                placeholder="Optional notes..."
                data-testid="input-entry-notes"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleEntrySubmit}
              disabled={createEntry.isPending || updateEntry.isPending}
              data-testid="button-submit-entry"
            >
              {(createEntry.isPending || updateEntry.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingEntry ? "Update Entry" : "Add Entry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Academics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null);
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);
  const [classForm, setClassForm] = useState({
    name: "", teacherName: "", gradingScale: "percentage", semester: "",
  });

  const { data: classes = [], isLoading } = useQuery<AcademicClass[]>({
    queryKey: ["/api/academics/classes"],
  });

  const createClass = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await apiRequest("POST", "/api/academics/classes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academics/classes"] });
      toast({ title: "Class added" });
      setClassDialogOpen(false);
      resetClassForm();
    },
    onError: () => toast({ title: "Failed to add class", variant: "destructive" }),
  });

  const updateClass = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown> & { id: number }) => {
      await apiRequest("PATCH", `/api/academics/classes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academics/classes"] });
      toast({ title: "Class updated" });
      setClassDialogOpen(false);
      setEditingClass(null);
      resetClassForm();
    },
    onError: () => toast({ title: "Failed to update class", variant: "destructive" }),
  });

  const deleteClass = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/academics/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academics/classes"] });
      toast({ title: "Class deleted" });
    },
    onError: () => toast({ title: "Failed to delete class", variant: "destructive" }),
  });

  const resetClassForm = () => setClassForm({ name: "", teacherName: "", gradingScale: "percentage", semester: "" });

  const handleClassSubmit = () => {
    if (!classForm.name.trim()) {
      toast({ title: "Please enter a class name", variant: "destructive" });
      return;
    }
    const data: Record<string, unknown> = {
      name: classForm.name.trim(),
      teacherName: classForm.teacherName.trim() || null,
      gradingScale: classForm.gradingScale,
      semester: classForm.semester.trim() || null,
    };
    if (editingClass) {
      updateClass.mutate({ id: editingClass.id, ...data });
    } else {
      createClass.mutate(data);
    }
  };

  const handleEditClass = (cls: AcademicClass) => {
    setEditingClass(cls);
    setClassForm({
      name: cls.name,
      teacherName: cls.teacherName || "",
      gradingScale: cls.gradingScale,
      semester: cls.semester || "",
    });
    setClassDialogOpen(true);
  };

  const filteredClasses = useMemo(() => {
    if (filterTab === "mine" && user) {
      return classes.filter(c => c.studentId === user.id);
    }
    return classes;
  }, [classes, filterTab, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" data-testid="loader-academics" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-32">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-academics-title">
            <GraduationCap className="w-6 h-6" />Academics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track classes, grades, and academic progress</p>
        </div>
        <Button
          size="sm"
          onClick={() => { resetClassForm(); setEditingClass(null); setClassDialogOpen(true); }}
          data-testid="button-add-class"
        >
          <Plus className="w-4 h-4 mr-1" />Add Class
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filterTab === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterTab("all")}
          data-testid="button-filter-all"
        >
          All Students
        </Button>
        <Button
          variant={filterTab === "mine" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterTab("mine")}
          data-testid="button-filter-mine"
        >
          My Classes
        </Button>
      </div>

      {filteredClasses.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground" data-testid="text-no-classes">No classes yet. Add your first class to get started.</p>
          </CardContent>
        </Card>
      )}

      {filteredClasses.map((cls) => {
        const isExpanded = expandedClassId === cls.id;
        return (
          <Card key={cls.id} data-testid={`card-class-${cls.id}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
                  data-testid={`toggle-class-${cls.id}`}
                >
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <CardTitle className="text-base font-semibold" data-testid={`text-class-name-${cls.id}`}>
                      {cls.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs" data-testid={`badge-scale-${cls.id}`}>
                      {cls.gradingScale}
                    </Badge>
                    {cls.semester && (
                      <Badge variant="secondary" className="text-xs" data-testid={`badge-semester-${cls.id}`}>
                        {cls.semester}
                      </Badge>
                    )}
                  </div>
                  {cls.teacherName && (
                    <p className="text-sm text-muted-foreground" data-testid={`text-teacher-${cls.id}`}>
                      Teacher: {cls.teacherName}
                    </p>
                  )}
                  {cls.currentGrade && (
                    <p className="text-sm font-medium" data-testid={`text-current-grade-${cls.id}`}>
                      Current Grade: {cls.currentGrade}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
                    data-testid={`button-expand-class-${cls.id}`}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`menu-class-${cls.id}`}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClass(cls)} data-testid={`edit-class-${cls.id}`}>
                        <Edit className="w-4 h-4 mr-2" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteClass.mutate(cls.id)} className="text-red-600" data-testid={`delete-class-${cls.id}`}>
                        <Trash2 className="w-4 h-4 mr-2" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent>
                <ClassEntries classItem={cls} />
              </CardContent>
            )}
          </Card>
        );
      })}

      <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClass ? "Edit Class" : "Add Class"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Class Name *</label>
              <Input
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                placeholder="e.g., Algebra II"
                data-testid="input-class-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Teacher Name</label>
              <Input
                value={classForm.teacherName}
                onChange={(e) => setClassForm({ ...classForm, teacherName: e.target.value })}
                placeholder="e.g., Mrs. Johnson"
                data-testid="input-teacher-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Grading Scale</label>
              <Select value={classForm.gradingScale} onValueChange={(v) => setClassForm({ ...classForm, gradingScale: v })}>
                <SelectTrigger data-testid="select-grading-scale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="letter">Letter Grade</SelectItem>
                  <SelectItem value="elementary">Elementary</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Semester</label>
              <Input
                value={classForm.semester}
                onChange={(e) => setClassForm({ ...classForm, semester: e.target.value })}
                placeholder="e.g., Fall 2025"
                data-testid="input-semester"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleClassSubmit}
              disabled={createClass.isPending || updateClass.isPending}
              data-testid="button-submit-class"
            >
              {(createClass.isPending || updateClass.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingClass ? "Update Class" : "Add Class"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
