import { useState, useRef, useEffect } from "react";
import { 
  useConversations, 
  useConversationMessages, 
  useSendMessage, 
  useCreateDM, 
  useAcceptConversation,
  useDeleteMessage,
  useFamilyMembers,
  useBlocks,
  useBlockUser,
  useUnblockUser,
} from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  Users, 
  MessageSquare, 
  Plus, 
  Check, 
  X, 
  Shield, 
  ShieldOff,
  Trash2,
  Lock,
  ChevronLeft,
  UserPlus,
  MoreVertical,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const { user } = useAuth();
  const { data: convos, isLoading: convosLoading } = useConversations();
  const { data: members } = useFamilyMembers();
  const { data: blocksList } = useBlocks();
  const { toast } = useToast();

  const [activeConvoId, setActiveConvoId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [showNewDM, setShowNewDM] = useState(false);
  const [mobileShowMessages, setMobileShowMessages] = useState(false);

  const { data: messages, isLoading: msgsLoading } = useConversationMessages(activeConvoId);
  const sendMessage = useSendMessage();
  const createDM = useCreateDM();
  const acceptConvo = useAcceptConversation();
  const deleteMsg = useDeleteMessage();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (convos?.length && !activeConvoId) {
      const groupConvo = convos.find((c: any) => c.type === "group");
      if (groupConvo) setActiveConvoId(groupConvo.id);
    }
  }, [convos, activeConvoId]);

  const activeConvo = convos?.find((c: any) => c.id === activeConvoId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeConvoId) return;
    sendMessage.mutate(
      { conversationId: activeConvoId, content },
      { onSuccess: () => setContent("") }
    );
  };

  const handleStartDM = (recipientId: string) => {
    createDM.mutate(recipientId, {
      onSuccess: (conv: any) => {
        setActiveConvoId(conv.id);
        setShowNewDM(false);
        setMobileShowMessages(true);
      },
      onError: (err: any) => {
        toast({ title: "Cannot start chat", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleAccept = (convoId: number) => {
    acceptConvo.mutate(convoId, {
      onSuccess: () => {
        toast({ title: "Chat accepted", description: "You can now message freely." });
      }
    });
  };

  const handleBlock = (blockedId: string) => {
    blockUser.mutate(blockedId, {
      onSuccess: () => {
        toast({ title: "User blocked", description: "They can no longer message you." });
      }
    });
  };

  const handleUnblock = (blockedId: string) => {
    unblockUser.mutate(blockedId, {
      onSuccess: () => {
        toast({ title: "User unblocked" });
      }
    });
  };

  const handleDeleteMsg = (msgId: number) => {
    deleteMsg.mutate(msgId);
  };

  const getConvoName = (convo: any) => {
    if (convo.type === "group") return convo.name || "Family Chat";
    const other = convo.participants?.find((p: any) => p.userId !== user?.id);
    return other?.firstName || other?.lastName || "Direct Message";
  };

  const getConvoAvatar = (convo: any) => {
    if (convo.type === "group") return null;
    const other = convo.participants?.find((p: any) => p.userId !== user?.id);
    return other?.profileImageUrl || null;
  };

  const getConvoInitial = (convo: any) => {
    if (convo.type === "group") return "F";
    const other = convo.participants?.find((p: any) => p.userId !== user?.id);
    return other?.firstName?.[0] || "?";
  };

  const isPending = (convo: any) => convo.status === "pending" && convo.createdBy !== user?.id;
  const isMyPending = (convo: any) => convo.status === "pending" && convo.createdBy === user?.id;

  const getOtherUserId = (convo: any) => {
    if (convo.type !== "dm") return null;
    const other = convo.participants?.find((p: any) => p.userId !== user?.id);
    return other?.userId || null;
  };

  const isBlockedUser = (userId: string) => {
    return blocksList?.some((b: any) => b.blockedId === userId);
  };

  const sortedConvos = [...(convos || [])].sort((a: any, b: any) => {
    if (a.type === "group") return -1;
    if (b.type === "group") return 1;
    const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  const pendingRequests = sortedConvos.filter((c: any) => isPending(c));
  const activeConvos = sortedConvos.filter((c: any) => !isPending(c));

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-2rem)] max-w-6xl mx-auto bg-card border border-border/50 rounded-[2rem] shadow-sm overflow-hidden" data-testid="chat-container">
      
      {/* Conversation List - Sidebar */}
      <div className={`w-full lg:w-80 border-r border-border/30 flex flex-col bg-card ${mobileShowMessages ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-lg" data-testid="text-chat-title">Messages</h2>
            <Dialog open={showNewDM} onOpenChange={setShowNewDM}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl" data-testid="button-new-dm">
                  <UserPlus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>New Direct Message</DialogTitle>
                  <DialogDescription>Choose a family member to start a private conversation with.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 mt-2">
                  {members?.filter((m: any) => m.userId !== user?.id).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">No other family members yet</p>
                      <p className="text-xs mt-1">Invite members from Settings to start chatting</p>
                    </div>
                  ) : (
                    members?.filter((m: any) => m.userId !== user?.id).map((member: any) => (
                      <button
                        key={member.userId}
                        onClick={() => handleStartDM(member.userId)}
                        className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                        data-testid={`button-dm-${member.userId}`}
                      >
                        <Avatar className="w-10 h-10 border border-border/50">
                          <AvatarImage src={member.user?.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {member.user?.firstName?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{member.user?.firstName} {member.user?.lastName}</p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        </div>
                        {isBlockedUser(member.userId) && (
                          <Shield className="w-4 h-4 text-destructive ml-auto" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-xs text-muted-foreground">Private and group conversations</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Pending Message Requests */}
          {pendingRequests.length > 0 && (
            <div className="px-3 pt-3">
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider px-2 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Message Requests
              </p>
              {pendingRequests.map((convo: any) => (
                <div
                  key={convo.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200/50 mb-2"
                  data-testid={`convo-request-${convo.id}`}
                >
                  <Avatar className="w-10 h-10 border border-amber-200">
                    <AvatarImage src={getConvoAvatar(convo) || undefined} />
                    <AvatarFallback className="bg-amber-100 text-amber-700 text-sm font-medium">
                      {getConvoInitial(convo)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{getConvoName(convo)}</p>
                    <p className="text-[11px] text-amber-600">Wants to message you</p>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-lg text-green-600 hover:bg-green-50"
                      onClick={() => handleAccept(convo.id)}
                      data-testid={`button-accept-${convo.id}`}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-lg text-destructive hover:bg-red-50"
                      data-testid={`button-decline-${convo.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Conversations */}
          <div className="px-3 pt-3 pb-2">
            {convosLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
            ) : activeConvos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No conversations yet</div>
            ) : (
              activeConvos.map((convo: any) => {
                const isActive = convo.id === activeConvoId;
                return (
                  <button
                    key={convo.id}
                    onClick={() => { setActiveConvoId(convo.id); setMobileShowMessages(true); }}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl mb-1 transition-all text-left ${
                      isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                    }`}
                    data-testid={`convo-item-${convo.id}`}
                  >
                    <Avatar className={`w-10 h-10 border ${isActive ? 'border-primary/30' : 'border-border/50'}`}>
                      {convo.type === "group" ? (
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                          <Users className="w-4 h-4" />
                        </AvatarFallback>
                      ) : (
                        <>
                          <AvatarImage src={getConvoAvatar(convo) || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {getConvoInitial(convo)}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium text-sm truncate ${isActive ? 'text-primary' : ''}`}>
                          {getConvoName(convo)}
                        </p>
                        {isMyPending(convo) && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Pending</span>
                        )}
                        {convo.type === "dm" && (
                          <Lock className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                        )}
                      </div>
                      {convo.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {convo.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {convo.lastMessage?.createdAt && (
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">
                        {format(new Date(convo.lastMessage.createdAt), 'h:mm a')}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Message View */}
      <div className={`flex-1 flex flex-col ${!mobileShowMessages ? 'hidden lg:flex' : 'flex'}`}>
        {!activeConvo ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Select a conversation</p>
            <p className="text-sm mt-1">Choose from the list or start a new direct message</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-card/80 backdrop-blur-sm">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden rounded-xl shrink-0" 
                onClick={() => setMobileShowMessages(false)}
                data-testid="button-back-to-list"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Avatar className="w-9 h-9 border border-border/50">
                {activeConvo.type === "group" ? (
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    <Users className="w-4 h-4" />
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={getConvoAvatar(activeConvo) || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {getConvoInitial(activeConvo)}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm" data-testid="text-active-convo-name">{getConvoName(activeConvo)}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {activeConvo.type === "group" 
                    ? `${activeConvo.participants?.length || 0} members` 
                    : "Private conversation"
                  }
                </p>
              </div>

              {activeConvo.type === "dm" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl" data-testid="button-convo-menu">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    {(() => {
                      const otherId = getOtherUserId(activeConvo);
                      if (!otherId) return null;
                      if (isBlockedUser(otherId)) {
                        return (
                          <DropdownMenuItem onClick={() => handleUnblock(otherId)} className="gap-2" data-testid="button-unblock">
                            <ShieldOff className="w-4 h-4" /> Unblock User
                          </DropdownMenuItem>
                        );
                      }
                      return (
                        <DropdownMenuItem onClick={() => handleBlock(otherId)} className="gap-2 text-destructive" data-testid="button-block">
                          <Shield className="w-4 h-4" /> Block User
                        </DropdownMenuItem>
                      );
                    })()}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Privacy Notice */}
            {activeConvo.type === "dm" && (
              <div className="px-4 py-2 bg-muted/30 border-b border-border/20 flex items-center gap-2">
                <Lock className="w-3 h-3 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground">
                  This is a private conversation. Only you and {getConvoName(activeConvo)} can see these messages.
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {msgsLoading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Loading messages...</div>
              ) : (messages || []).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <span className="text-4xl mb-2">
                    {activeConvo.type === "group" ? "👋" : "🔒"}
                  </span>
                  <p className="font-medium text-sm">
                    {activeConvo.type === "group" ? "Say hello to the family!" : "Start a private conversation"}
                  </p>
                  <p className="text-xs mt-1 text-muted-foreground/60">
                    {activeConvo.type === "dm" ? "Messages here are only visible to both of you" : "Everyone in the family can see these messages"}
                  </p>
                </div>
              ) : (
                (messages || []).map((msg: any, idx: number) => {
                  const isMe = msg.senderId === user?.id;
                  const prev = (messages || [])[idx - 1];
                  const showHeader = idx === 0 || prev?.senderId !== msg.senderId;
                  
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`} data-testid={`message-${msg.id}`}>
                      {showHeader && (
                        <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          <Avatar className="w-6 h-6 border border-border/50">
                            <AvatarImage src={msg.user?.profileImageUrl || undefined} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {msg.user?.firstName?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-muted-foreground">
                            {isMe ? 'You' : msg.user?.firstName}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50">
                            {format(new Date(msg.createdAt), 'h:mm a')}
                          </span>
                        </div>
                      )}
                      <div className="group flex items-center gap-1">
                        {isMe && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteMsg(msg.id)}
                            data-testid={`button-delete-msg-${msg.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                        <div 
                          className={`max-w-[75%] px-4 py-2.5 text-sm shadow-sm ${
                            isMe 
                              ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' 
                              : 'bg-muted border border-border/50 rounded-2xl rounded-tl-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-background/80 border-t border-border/30 backdrop-blur-sm">
              {isPending(activeConvo) ? (
                <div className="flex items-center justify-center gap-3 p-3">
                  <p className="text-sm text-muted-foreground">Accept this message request to reply</p>
                  <Button 
                    size="sm" 
                    className="rounded-xl" 
                    onClick={() => handleAccept(activeConvo.id)}
                    data-testid="button-accept-inline"
                  >
                    <Check className="w-4 h-4 mr-1" /> Accept
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex gap-2" data-testid="form-send-message">
                  <Input 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    placeholder="Type a message..." 
                    className="flex-1 rounded-xl bg-muted/50 border-transparent focus-visible:ring-primary/20 h-12"
                    data-testid="input-message"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!content.trim() || sendMessage.isPending}
                    className="rounded-xl h-12 w-12 shrink-0 bg-primary shadow-md transition-transform active:scale-95"
                    data-testid="button-send"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
