import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Loader2, Users, Calendar, Shield, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function JoinFamily() {
  const [, params] = useRoute("/join/:token");
  const token = params?.token || "";
  const { user, isAuthenticated, login } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [accepted, setAccepted] = useState(false);

  const { data: inviteInfo, isLoading, error } = useQuery({
    queryKey: ['/api/invite', token],
    queryFn: async () => {
      const res = await fetch(`/api/invite/${token}`);
      if (res.status === 404) throw new Error("This invite link is invalid.");
      if (res.status === 410) throw new Error("This invite has expired or been used.");
      if (!res.ok) throw new Error("Something went wrong.");
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!birthMonth || !birthYear) throw new Error("Please enter your date of birth.");
      const dateOfBirth = new Date(Number(birthYear), Number(birthMonth) - 1, 1).toISOString();
      const res = await apiRequest("POST", `/api/invite/${token}/accept`, {
        displayName: displayName.trim() || undefined,
        dateOfBirth,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to join family");
      }
      return res.json();
    },
    onSuccess: () => {
      setAccepted(true);
      queryClient.invalidateQueries({ queryKey: ['/api/family'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    },
    onError: (err: Error) => {
      toast({ title: "Could not join", description: err.message, variant: "destructive" });
    },
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !inviteInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc] p-6">
        <Card className="rounded-3xl border-0 shadow-xl max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-display font-black" data-testid="text-invite-error">Invite not available</h1>
            <p className="text-muted-foreground" data-testid="text-invite-error-detail">
              {(error as Error)?.message || "This invite link is no longer valid."}
            </p>
            <Button onClick={() => window.location.href = "/"} className="rounded-xl" data-testid="button-go-home">
              Go to FamilyHub
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc] p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="rounded-3xl border-0 shadow-xl max-w-md w-full">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-display font-black" data-testid="text-invite-success">You're in!</h1>
              <p className="text-muted-foreground">Welcome to {inviteInfo.familyName}. Taking you home...</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafbfc] p-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md"
      >
        <Card className="rounded-3xl border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-black text-white" data-testid="text-invite-family-name">
              Join {inviteInfo.familyName}
            </h1>
            <p className="text-white/80 mt-1 font-medium" data-testid="text-invite-role">
              You've been invited as {inviteInfo.role === "Adult" ? "an" : "a"} {inviteInfo.role}
            </p>
          </div>

          <CardContent className="p-6 space-y-5">
            {!isAuthenticated ? (
              <div className="space-y-4 text-center">
                <p className="text-muted-foreground font-medium">Sign in with Replit to continue</p>
                <Button onClick={login} className="w-full h-12 rounded-2xl font-bold text-base shadow-lg" data-testid="button-login-to-join">
                  Sign in to join
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold" data-testid="label-display-name">Display name</label>
                  <Input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder={user?.firstName || "Your name"}
                    className="h-12 rounded-xl"
                    data-testid="input-display-name"
                  />
                  <p className="text-xs text-muted-foreground">How family members will see you</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold" data-testid="label-date-of-birth">Date of birth <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={birthMonth} onValueChange={setBirthMonth}>
                      <SelectTrigger className="h-12 rounded-xl" data-testid="select-birth-month">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((m, i) => (
                          <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={birthYear} onValueChange={setBirthYear}>
                      <SelectTrigger className="h-12 rounded-xl" data-testid="select-birth-year">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(y => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">Used to determine your role and permissions</p>
                </div>

                <Button
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending || !birthMonth || !birthYear}
                  className="w-full h-12 rounded-2xl font-bold text-base shadow-lg shadow-primary/20"
                  data-testid="button-accept-invite"
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Join Family"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
