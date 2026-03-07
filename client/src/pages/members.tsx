import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useFamily } from "@/hooks/use-family";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  CalendarDays,
  GraduationCap,
  Target,
  Users,
} from "lucide-react";
import type { FamilyMember } from "@shared/schema";

type MemberWithUser = FamilyMember & {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profileImageUrl: string | null;
  };
};

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case "Owner":
      return "default";
    case "Adult":
      return "secondary";
    case "Teen":
    case "Youth":
      return "outline";
    case "Child":
      return "outline";
    case "Caregiver":
      return "secondary";
    default:
      return "outline";
  }
};

export default function MembersPage() {
  const { user } = useAuth();
  const { data: family } = useFamily();
  const [, setLocation] = useLocation();

  const { data: members, isLoading } = useQuery<MemberWithUser[]>({
    queryKey: ["/api/family/members"],
    enabled: !!family,
  });

  const currentMember = members?.find((m) => m.userId === user?.id);
  const isParentOrOwner =
    currentMember?.role === "Owner" || currentMember?.role === "Adult";

  const isChildRole = (role: string) =>
    ["Child", "Youth", "Teen"].includes(role);

  const getDisplayName = (member: MemberWithUser) =>
    member.displayName ||
    [member.user.firstName, member.user.lastName].filter(Boolean).join(" ") ||
    "Family Member";

  const getInitials = (member: MemberWithUser) => {
    const name = member.displayName || "";
    if (name) {
      const parts = name.split(" ");
      return parts
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return (
      ((member.user.firstName?.[0] || "") + (member.user.lastName?.[0] || ""))
        .toUpperCase() || "?"
    );
  };

  const handleMessage = (member: MemberWithUser) => {
    setLocation("/chat");
  };

  const handleViewSchedule = () => {
    setLocation("/schedule");
  };

  const handleViewAcademics = () => {
    setLocation("/academics");
  };

  const handleViewGoals = () => {
    setLocation("/goals");
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-6 h-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold" data-testid="text-members-title">
            Family Members
          </h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-6 h-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold" data-testid="text-members-title">
          Family Members
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4" data-testid="text-members-subtitle">
        {family?.name ? `${family.name} — ` : ""}
        {members?.length || 0} member{(members?.length || 0) !== 1 ? "s" : ""}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {members?.map((member) => {
          const isSelf = member.userId === user?.id;
          const showKidActions = isParentOrOwner && isChildRole(member.role);

          return (
            <Card
              key={member.id}
              className="p-4"
              data-testid={`card-member-${member.id}`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12 shrink-0">
                  <AvatarImage
                    src={member.user.profileImageUrl || undefined}
                    alt={getDisplayName(member)}
                  />
                  <AvatarFallback className="text-sm font-semibold">
                    {getInitials(member)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-semibold truncate"
                      data-testid={`text-member-name-${member.id}`}
                    >
                      {getDisplayName(member)}
                      {isSelf ? " (You)" : ""}
                    </span>
                    <Badge
                      variant={roleBadgeVariant(member.role)}
                      className="text-[10px]"
                      data-testid={`badge-member-role-${member.id}`}
                    >
                      {member.role}
                    </Badge>
                  </div>
                  {member.user.email && (
                    <p
                      className="text-xs text-muted-foreground truncate mt-0.5"
                      data-testid={`text-member-email-${member.id}`}
                    >
                      {member.user.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {!isSelf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMessage(member)}
                    data-testid={`button-message-${member.id}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                    Message
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewSchedule}
                  data-testid={`button-schedule-${member.id}`}
                >
                  <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                  Schedule
                </Button>
                {showKidActions && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewAcademics}
                      data-testid={`button-academics-${member.id}`}
                    >
                      <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
                      Academics
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewGoals}
                      data-testid={`button-goals-${member.id}`}
                    >
                      <Target className="w-3.5 h-3.5 mr-1.5" />
                      Goals
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {(!members || members.length === 0) && (
        <div className="text-center py-12 text-muted-foreground" data-testid="text-no-members">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No family members yet</p>
          <p className="text-sm mt-1">
            Invite family members from Settings to get started.
          </p>
        </div>
      )}
    </div>
  );
}
