import { useState } from "react";
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/use-events";
import { useFinancialSchedule } from "@/hooks/use-expenses";
import { useAuth } from "@/hooks/use-auth";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, addDays, addYears, getDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CalendarPlus, MapPin, Clock, ChevronLeft, ChevronRight, Lock, Users, Info, DollarSign, CreditCard, Pencil, Trash2, Repeat, X } from "lucide-react";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function getBillDatesInRange(bill: any, rangeStart: Date, rangeEnd: Date): Date[] {
  const dates: Date[] = [];
  let current = new Date(bill.dueDate);
  if (isNaN(current.getTime())) return dates;
  if (!bill.frequency || bill.frequency === "One-time") {
    if (current >= rangeStart && current <= rangeEnd) dates.push(current);
    return dates;
  }
  let safety = 0;
  while (current <= rangeEnd && safety < 500) {
    if (current >= rangeStart) {
      dates.push(new Date(current));
    }
    const prev = current.getTime();
    switch (bill.frequency) {
      case "Weekly": current = addWeeks(current, 1); break;
      case "Bi-weekly": current = addWeeks(current, 2); break;
      case "Monthly": current = addMonths(current, 1); break;
      case "Quarterly": current = addMonths(current, 3); break;
      case "Yearly": current = addYears(current, 1); break;
      default: current = addMonths(current, 1);
    }
    if (current.getTime() === prev) break;
    safety++;
  }
  return dates;
}

function getEventOccurrencesForDay(event: any, day: Date): boolean {
  const eventDate = new Date(event.date);
  if (event.recurrence === "One-time") {
    return isSameDay(eventDate, day);
  }
  if (day < new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())) return false;
  if (event.recurrenceEnd && day > new Date(event.recurrenceEnd)) return false;

  const dayOfWeek = DAY_KEYS[getDay(day)];

  switch (event.recurrence) {
    case "Daily":
      if (event.recurrenceDays && event.recurrenceDays.length > 0) {
        return event.recurrenceDays.includes(dayOfWeek);
      }
      return true;
    case "Weekly":
      if (event.recurrenceDays && event.recurrenceDays.length > 0) {
        return event.recurrenceDays.includes(dayOfWeek);
      }
      return getDay(eventDate) === getDay(day);
    case "Monthly":
      return eventDate.getDate() === day.getDate();
    case "Yearly":
      return eventDate.getMonth() === day.getMonth() && eventDate.getDate() === day.getDate();
    default:
      return isSameDay(eventDate, day);
  }
}

const INITIAL_FORM = {
  title: "",
  description: "",
  date: format(new Date(), 'yyyy-MM-dd'),
  time: "12:00",
  recurrence: "One-time",
  recurrenceDays: [] as string[],
  recurrenceEnd: "",
  isPersonal: false,
  notes: "",
  location: ""
};

export default function Schedule() {
  const { data: events, isLoading } = useEvents();
  const { data: bills } = useFinancialSchedule();
  const { user } = useAuth();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState(INITIAL_FORM);

  const userId = user?.id;

  const visibleEvents = (events || []).filter((e: any) => {
    if (!e.isPersonal) return true;
    return e.creatorId === userId;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.time) return;
    
    const dateTime = new Date(`${formData.date}T${formData.time}`);
    const payload: any = {
      title: formData.title,
      description: formData.description,
      date: dateTime.toISOString(),
      startTime: dateTime.toISOString(),
      recurrence: formData.recurrence,
      recurrenceDays: formData.recurrence !== "One-time" && formData.recurrenceDays.length > 0 ? formData.recurrenceDays : null,
      recurrenceEnd: formData.recurrenceEnd || null,
      isPersonal: formData.isPersonal,
      notes: formData.notes,
      location: formData.location,
    };

    if (editingEvent) {
      updateEvent.mutate(
        { id: editingEvent.id, ...payload },
        { onSuccess: () => {
          setIsOpen(false);
          setEditingEvent(null);
          setFormData(INITIAL_FORM);
          toast({ title: "Event updated" });
        }}
      );
    } else {
      createEvent.mutate(payload, {
        onSuccess: () => {
          setIsOpen(false);
          setFormData(INITIAL_FORM);
          toast({ title: "Event created" });
        }
      });
    }
  };

  const handleEdit = (event: any) => {
    const eventDate = new Date(event.date);
    setEditingEvent(event);
    setFormData({
      title: event.title || "",
      description: event.description || "",
      date: format(eventDate, 'yyyy-MM-dd'),
      time: format(eventDate, 'HH:mm'),
      recurrence: event.recurrence || "One-time",
      recurrenceDays: event.recurrenceDays || [],
      recurrenceEnd: event.recurrenceEnd ? format(new Date(event.recurrenceEnd), 'yyyy-MM-dd') : "",
      isPersonal: event.isPersonal || false,
      notes: event.notes || "",
      location: event.location || "",
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteEvent.mutate(id, {
      onSuccess: () => {
        setDeleteConfirm(null);
        toast({ title: "Event deleted" });
      }
    });
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      recurrenceDays: prev.recurrenceDays.includes(day)
        ? prev.recurrenceDays.filter(d => d !== day)
        : [...prev.recurrenceDays, day]
    }));
  };

  const applyPreset = (preset: string) => {
    if (preset === "weekdays") {
      setFormData(prev => ({ ...prev, recurrenceDays: ["mon", "tue", "wed", "thu", "fri"] }));
    } else if (preset === "everyday") {
      setFormData(prev => ({ ...prev, recurrenceDays: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] }));
    } else if (preset === "weekends") {
      setFormData(prev => ({ ...prev, recurrenceDays: ["sat", "sun"] }));
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const dayEvents = visibleEvents.filter((e: any) => getEventOccurrencesForDay(e, selectedDate));

  const billsData = bills || [];
  const billOccurrencesForDay = (day: Date) => {
    return billsData.flatMap(bill => {
      const dates = getBillDatesInRange(bill, new Date(day.getFullYear(), day.getMonth(), day.getDate()), new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59));
      return dates.length > 0 ? [bill] : [];
    });
  };
  const dayBills = billOccurrencesForDay(selectedDate);

  const showRecurrenceDays = formData.recurrence === "Daily" || formData.recurrence === "Weekly";

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tight text-slate-900">Schedule</h1>
          <p className="text-slate-600 mt-2 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Family Coordination Engine
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) { setEditingEvent(null); setFormData(INITIAL_FORM); }
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-14 px-8 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-3 text-lg font-black bg-primary text-white" data-testid="button-add-event">
              <CalendarPlus className="w-6 h-6" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl rounded-[2rem] border-none shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="font-display text-3xl font-black text-slate-900">
                {editingEvent ? "Edit Event" : "New Event"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 ml-1">Title</label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Work, School, Soccer practice" className="rounded-2xl h-14 bg-slate-50 border-2 border-slate-100 focus:border-primary/30 text-lg font-bold" data-testid="input-event-title" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 ml-1">Start Date</label>
                  <Input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="rounded-2xl h-14 bg-slate-50 border-2 border-slate-100 font-bold" data-testid="input-event-date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 ml-1">Time</label>
                  <Input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="rounded-2xl h-14 bg-slate-50 border-2 border-slate-100 font-bold" data-testid="input-event-time" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 ml-1">Repeats</label>
                  <Select value={formData.recurrence} onValueChange={v => setFormData({...formData, recurrence: v, recurrenceDays: v === "One-time" ? [] : formData.recurrenceDays})} data-testid="select-recurrence">
                    <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-2 border-slate-100 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="One-time">One-time</SelectItem>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 ml-1">Visibility</label>
                  <div className="flex items-center gap-3 h-14 px-4 bg-slate-50 border-2 border-slate-100 rounded-2xl">
                    <Checkbox id="isPersonal" checked={formData.isPersonal} onCheckedChange={(checked) => setFormData({...formData, isPersonal: !!checked})} data-testid="checkbox-personal" />
                    <label htmlFor="isPersonal" className="text-sm font-bold cursor-pointer flex items-center gap-2">
                      {formData.isPersonal ? <Lock className="w-4 h-4 text-amber-500" /> : <Users className="w-4 h-4 text-primary" />}
                      {formData.isPersonal ? "Personal" : "Shared"}
                    </label>
                  </div>
                </div>
              </div>

              {formData.recurrence !== "One-time" && (
                <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border-2 border-slate-100">
                  {showRecurrenceDays && (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-slate-700 flex items-center gap-2">
                          <Repeat className="w-4 h-4 text-primary" /> Repeat on specific days
                        </label>
                      </div>
                      <div className="flex gap-1.5">
                        {DAY_KEYS.map((day, i) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                              formData.recurrenceDays.includes(day)
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-white text-slate-500 border-2 border-slate-200 hover:border-primary/30'
                            }`}
                            data-testid={`day-toggle-${day}`}
                          >
                            {DAY_LABELS[i].slice(0, 2)}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => applyPreset("weekdays")} className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all" data-testid="preset-weekdays">
                          Weekdays
                        </button>
                        <button type="button" onClick={() => applyPreset("everyday")} className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all" data-testid="preset-everyday">
                          Every day
                        </button>
                        <button type="button" onClick={() => applyPreset("weekends")} className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all" data-testid="preset-weekends">
                          Weekends
                        </button>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 ml-1">End date (optional)</label>
                    <Input type="date" value={formData.recurrenceEnd} onChange={e => setFormData({...formData, recurrenceEnd: e.target.value})} className="rounded-xl h-12 bg-white border-2 border-slate-200 font-bold text-sm" data-testid="input-recurrence-end" />
                    <p className="text-[11px] text-slate-400 ml-1">Leave empty for no end date</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 ml-1">Location</label>
                <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Town Square, Main Field" className="rounded-2xl h-14 bg-slate-50 border-2 border-slate-100 font-bold" data-testid="input-event-location" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 ml-1">Notes</label>
                <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Any extra details?" className="rounded-2xl h-14 bg-slate-50 border-2 border-slate-100 font-bold" data-testid="input-event-notes" />
              </div>

              <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending} className="w-full rounded-2xl h-16 text-xl font-black shadow-xl shadow-primary/20 mt-4 transition-all hover:scale-[1.01]" data-testid="button-submit-event">
                {createEvent.isPending || updateEvent.isPending ? "Saving..." : editingEvent ? "Save Changes" : "Confirm Event"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[2.5rem] border-white/80 shadow-2xl bg-white/90 backdrop-blur-xl overflow-hidden p-6">
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-2xl font-display font-black text-slate-900">{format(currentDate, 'MMMM yyyy')}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="rounded-xl border-2" data-testid="button-prev-month"><ChevronLeft className="w-5 h-5" /></Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="rounded-xl border-2" data-testid="button-next-month"><ChevronRight className="w-5 h-5" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 pb-4">{d}</div>
            ))}
            {calendarDays.map((day, i) => {
              const dayEvts = visibleEvents.filter((e: any) => getEventOccurrencesForDay(e, day));
              const dayBls = billOccurrencesForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, monthStart);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative h-24 rounded-2xl border-2 transition-all p-2 flex flex-col items-start group
                    ${isSelected ? 'border-primary bg-primary/5 shadow-inner' : 'border-slate-50 hover:border-primary/20 bg-white/50'}
                    ${!isCurrentMonth && 'opacity-30'}
                  `}
                  data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                >
                  <span className={`text-sm font-black ${isToday ? 'bg-primary text-white w-7 h-7 flex items-center justify-center rounded-full -mt-1 -ml-1' : 'text-slate-900'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-auto flex flex-wrap gap-1">
                    {dayEvts.slice(0, 3).map((e: any) => (
                      <div key={e.id} className={`w-1.5 h-1.5 rounded-full ${e.isPersonal ? 'bg-amber-400' : 'bg-primary'}`} />
                    ))}
                    {dayEvts.length > 3 && (
                      <span className="text-[8px] font-bold text-slate-400">+{dayEvts.length - 3}</span>
                    )}
                    {dayBls.filter(b => !b.isPaid).slice(0, 2).map(b => (
                      <div key={`bill-${b.id}`} className={`w-1.5 h-1.5 rounded-full ${b.isPayday ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-display font-black text-slate-900">{format(selectedDate, 'MMM d, yyyy')}</h3>
          </div>
          <div className="space-y-4">
            {dayEvents.length === 0 && dayBills.length === 0 ? (
              <Card className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/40 p-10 text-center">
                <p className="text-slate-400 font-bold italic">Nothing scheduled.</p>
              </Card>
            ) : (
              <>
                {dayEvents.map((event: any) => (
                  <Card key={event.id} className="rounded-3xl border-white/80 shadow-lg bg-white/95 p-5 transition-all hover:scale-[1.02]" data-testid={`card-event-${event.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2.5 rounded-2xl ${event.isPersonal ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                        {event.isPersonal ? <Lock className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {event.recurrence !== "One-time" && (
                          <Badge variant="outline" className="rounded-lg text-[10px] font-bold border-primary/20 text-primary">
                            <Repeat className="w-3 h-3 mr-1" />
                            {event.recurrenceDays?.length > 0
                              ? event.recurrenceDays.map((d: string) => d.slice(0, 2).toUpperCase()).join(", ")
                              : event.recurrence}
                          </Badge>
                        )}
                        {event.creatorId === userId && (
                          <div className="flex gap-1">
                            <button onClick={() => handleEdit(event)} className="p-1.5 rounded-xl hover:bg-slate-100 transition-all" data-testid={`button-edit-event-${event.id}`}>
                              <Pencil className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            {deleteConfirm === event.id ? (
                              <div className="flex gap-1">
                                <button onClick={() => handleDelete(event.id)} className="p-1.5 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-all" data-testid={`button-confirm-delete-${event.id}`}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded-xl hover:bg-slate-100 transition-all">
                                  <X className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(event.id)} className="p-1.5 rounded-xl hover:bg-red-50 transition-all" data-testid={`button-delete-event-${event.id}`}>
                                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <h4 className="font-black text-xl text-slate-900 mb-1">{event.title}</h4>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm font-bold text-slate-500">{format(new Date(event.date), 'h:mm a')}</span>
                      {event.creatorDisplayName && (
                        <span className="text-xs text-slate-400 font-medium">· {event.creatorDisplayName}</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                          <MapPin className="w-4 h-4" /> {event.location}
                        </div>
                      )}
                      {event.notes && (
                        <div className="flex items-start gap-2 text-sm text-slate-500 font-medium bg-slate-50 p-3 rounded-2xl border-2 border-white">
                          <Info className="w-4 h-4 mt-0.5 text-primary" /> {event.notes}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
                {dayBills.map(bill => (
                  <Card key={`bill-${bill.id}`} className={`rounded-3xl shadow-lg p-5 transition-all hover:scale-[1.02] ${bill.isPayday ? 'border-emerald-200 bg-emerald-50/80' : 'border-rose-200 bg-rose-50/80'}`} data-testid={`card-schedule-bill-${bill.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2.5 rounded-2xl ${bill.isPayday ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {bill.isPayday ? <DollarSign className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                      </div>
                      <Badge variant="outline" className={`rounded-lg text-[10px] font-bold ${bill.isPayday ? 'border-emerald-200 text-emerald-700' : 'border-rose-200 text-rose-700'}`}>
                        {bill.isPayday ? "INCOME" : "BILL DUE"}
                      </Badge>
                    </div>
                    <h4 className="font-black text-xl text-slate-900 mb-1">{bill.title}</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`font-display font-bold text-lg ${bill.isPayday ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {bill.isPayday ? '+' : '-'}${Number(bill.amount).toFixed(2)}
                      </span>
                      <span className="text-slate-400 text-xs font-medium">{bill.frequency}</span>
                      {bill.category && <span className="text-slate-400 text-xs">| {bill.category}</span>}
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
