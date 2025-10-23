import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Search, Plus, Paperclip, Phone, Video, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { apiRequest, useMessages, useUserProfile } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/useSocket";

interface MessagesProps {
  userRole: string;
}

export const Messages = ({ userRole }: MessagesProps) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { data: messagesData, loading, error, refetch } = useMessages();
  const messages = Array.isArray(messagesData) ? messagesData : (messagesData as any)?.messages || [];
  const { data: currentUser } = useUserProfile();
  const { toast } = useToast();
  const { on, off } = useSocket();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  // Track seen message IDs to prevent duplicates from optimistic updates + socket echo
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  // Prevent rapid double submissions
  const sendingRef = useRef(false);

  // Build threads (sidebar): last message preview and sort by latest
  const threads = useMemo(() => {
    if (!Array.isArray(messages) || !currentUser) return [] as Array<{ id: string; name: string; avatar?: string; lastMessage?: string; lastAt?: string; role?: string; email?: string }>;
    const map = new Map<string, { id: string; name: string; avatar?: string; lastMessage?: string; lastAt?: string; role?: string; email?: string }>();
    for (const m of messages as any[]) {
      const from = m.fromUserId;
      const to = m.toUserId;
      const myId = currentUser?._id;
      const other = from && from._id !== myId ? from : to;
      if (!other) continue;
      const partnerId = typeof other === 'object' ? other._id : other;
      const partnerName = (other?.name || other?.email || 'User');
      const lastAt = m.createdAt;
      const prev = map.get(partnerId);
      if (!prev || (prev.lastAt && lastAt > prev.lastAt) || !prev.lastAt) {
        map.set(partnerId, {
          id: partnerId,
          name: partnerName,
          avatar: other?.profilePicture,
          role: other?.role,
          email: other?.email,
          lastMessage: m.content,
          lastAt,
        });
      }
    }
    // If a search-selected user has no messages yet, still show a placeholder entry
    if (selectedPartnerId && !map.has(selectedPartnerId)) {
      map.set(selectedPartnerId, { id: selectedPartnerId, name: 'User', avatar: undefined });
    }
    return Array.from(map.values()).sort((a, b) => {
      const at = a.lastAt ? new Date(a.lastAt).getTime() : 0;
      const bt = b.lastAt ? new Date(b.lastAt).getTime() : 0;
      return bt - at; // most recent first
    });
  }, [messages, currentUser, selectedPartnerId]);

  const selectedPartner = useMemo(() => {
    if (!selectedPartnerId) return null;
    return threads.find(t => t.id === selectedPartnerId) || null;
  }, [threads, selectedPartnerId]);

  // Debounced user search against backend
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await apiRequest(`/api/users/search?q=${encodeURIComponent(q)}`);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadConversation = async (partnerId: string) => {
    setIsLoadingConversation(true);
    try {
      const res = await apiRequest(`/api/messages/${partnerId}`);
      // Backend returns ascending order (createdAt: 1)
      const msgs = Array.isArray(res?.messages) ? res.messages : [];
      // Reset seenMessageIds for the opened conversation
      const nextSeen = new Set<string>();
      for (const m of msgs) {
        if (m?._id) nextSeen.add(String(m._id));
      }
      seenMessageIdsRef.current = nextSeen;
      setConversationMessages(msgs);
    } catch (_e) {
      setConversationMessages([]);
    } finally {
      setIsLoadingConversation(false);
      // Allow next paint to render then scroll
      setTimeout(scrollToBottom, 50);
    }
  };

  // Initialize selection to most recent thread
  useEffect(() => {
    if (!selectedPartnerId && threads.length > 0) {
      setSelectedPartnerId(threads[0].id);
    }
  }, [threads, selectedPartnerId]);

  // Load conversation when selection changes
  useEffect(() => {
    if (selectedPartnerId) {
      loadConversation(selectedPartnerId);
    } else {
      setConversationMessages([]);
    }
  }, [selectedPartnerId]);

  // Auto-scroll when messages update
  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages.length]);

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content) return;
    if (sendingRef.current) {
      console.log('[Messages] sendMessage ignored (already sending)');
      return;
    }
    if (!selectedPartnerId) {
      toast({ title: 'Select a conversation', description: 'Choose a user to chat with.', variant: 'destructive' });
      return;
    }
    try {
      console.log('[Messages] sendMessage called once', { to: selectedPartnerId, content });
      sendingRef.current = true;
      const created = await apiRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ toUserId: selectedPartnerId, content })
      });
      // Optimistically append new message to current conversation
      if (created?._id && !seenMessageIdsRef.current.has(String(created._id))) {
        seenMessageIdsRef.current.add(String(created._id));
        setConversationMessages(prev => ([...prev, created]));
      }
      setNewMessage("");
      // Refresh threads list so sidebar ordering/preview updates
      refetch();
      setTimeout(scrollToBottom, 30);
    } catch (error) {
      toast({ title: "Failed to send message", description: "Please try again later.", variant: "destructive" });
    }
    finally {
      sendingRef.current = false;
    }
  };

  // Real-time updates: subscribe to new messages
  useEffect(() => {
    const handler = (msg: any) => {
      console.log('[Messages] socket message:new received', msg);
      const id = msg?._id ? String(msg._id) : undefined;
      if (id && seenMessageIdsRef.current.has(id)) {
        // Already displayed (from optimistic update or prior event)
        return;
      }
      const involvesSelected = selectedPartnerId && (msg.fromUserId === selectedPartnerId || msg.toUserId === selectedPartnerId);
      if (involvesSelected) {
        if (id) seenMessageIdsRef.current.add(id);
        setConversationMessages(prev => ([...prev, msg]));
        setTimeout(scrollToBottom, 20);
      }
      // Update threads
      refetch();
    };
    on?.('message:new', handler);
    return () => {
      off?.('message:new', handler as any);
    };
  }, [on, off, selectedPartnerId, refetch]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading messages...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load messages</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">Communicate with your care team</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px] lg:h-[700px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <Button size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (searchResults.length > 0 || searchLoading) && (
                <div className="absolute z-10 mt-2 w-full bg-background border border-border rounded-md shadow-sm max-h-64 overflow-y-auto">
                  {searchLoading && (
                    <div className="p-3 text-sm text-muted-foreground">Searching...</div>
                  )}
                  {searchResults.map((u: any) => (
                    <div
                      key={u._id}
                      className="p-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3"
                      onClick={() => {
                        setSelectedPartnerId(u._id);
                        setSearchQuery("");
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.profilePicture} />
                        <AvatarFallback>{(u.name || u.email || 'U').split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.name || u.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {threads.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 border-b border-border last:border-b-0 ${
                    selectedPartnerId === conversation.id ? "bg-muted" : ""
                  }`}
                  onClick={() => setSelectedPartnerId(conversation.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback>{conversation.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm truncate">{conversation.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {conversation.lastAt ? new Date(conversation.lastAt).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">{conversation.lastMessage || ''}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {/* Chat Header */}
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedPartner?.avatar} />
                  <AvatarFallback>
                    {selectedPartner?.name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedPartner?.name || 'Conversation'}</h3>
                  <p className="text-sm text-muted-foreground">&nbsp;</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Video className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <Separator />

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {(() => {
              if (isLoadingConversation) {
                return (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Loading conversation...</span>
                    </div>
                  </div>
                );
              }
              if (!selectedPartnerId) {
                return (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Select or start a conversation</h3>
                      <p className="text-muted-foreground mb-4">Search users to start chatting.</p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Conversation
                      </Button>
                    </div>
                  </div>
                );
              }
              return (
                <div>
                  {(conversationMessages as any[]).map((message) => {
                    const mine = currentUser && (message.fromUserId?._id === currentUser._id || message.fromUserId === currentUser._id);
                    return (
                      <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-lg p-3 ${mine ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <div ref={messagesEndRef} />
          </CardContent>

          <Separator />

          {/* Message Input */}
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-10 w-10 p-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[40px] max-h-[120px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
              </div>
              <Button onClick={sendMessage} className="h-10 w-10 p-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};