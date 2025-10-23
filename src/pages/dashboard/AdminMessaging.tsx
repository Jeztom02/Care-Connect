import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Send, Users, Filter, Search, Plus, Loader2, RefreshCw, Eye, Trash2, User, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/hooks/useApi";

interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  targetRoles: string[];
  targetUsers: string[];
  isGlobal: boolean;
  status: string;
  sentAt?: string;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export const AdminMessaging = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("create");
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  // Direct messaging state
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [chatRecipient, setChatRecipient] = useState<User | null>(null);
  const [directMessageContent, setDirectMessageContent] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    priority: "all"
  });

  // Form state for creating announcements
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    type: "Announcement",
    priority: "Medium",
    targetRoles: [] as string[],
    targetUsers: [] as string[],
    isGlobal: false,
    expiresAt: "",
    sendImmediately: false
  });

  // Fetch users for search
  const fetchUsers = async () => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/admin/users?limit=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Fetch current user profile to identify self in threads
    (async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const meRes = await fetch(`${backendUrl}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (meRes.ok) {
          const me = await meRes.json();
          const id = me?._id || me?.id || me?.user?.id || me?.user?._id || me?.user?.sub || null;
          setCurrentUserId(id);
        }
      } catch (_e) {
        // ignore
      }
    })();
    // Initial messages load
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setMessagesLoading(true);
      setMessagesError(null);
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/messages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to load messages' }));
        throw new Error(err.message || 'Failed to load messages');
      }
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : (data?.messages ?? []));
    } catch (e) {
      setMessagesError(e instanceof Error ? e.message : 'Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.message) {
      toast({
        title: "Validation Error",
        description: "Title and message are required.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(announcementForm)
      });

      if (!response.ok) {
        throw new Error('Failed to create announcement');
      }

      toast({
        title: "Success",
        description: "Announcement created successfully.",
      });

      // Reset form
      setAnnouncementForm({
        title: "",
        message: "",
        type: "Announcement",
        priority: "Medium",
        targetRoles: [],
        targetUsers: [],
        isGlobal: false,
        expiresAt: "",
        sendImmediately: false
      });

      // Refresh announcements
      fetchAnnouncements();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create announcement.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/admin/announcements', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleSendAnnouncement = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/announcements/${id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to send announcement');
      }

      toast({
        title: "Success",
        description: "Announcement sent successfully.",
      });

      fetchAnnouncements();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send announcement.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Sent": return "bg-green-100 text-green-700";
      case "Draft": return "bg-yellow-100 text-yellow-700";
      case "Delivered": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-700";
      case "High": return "bg-orange-100 text-orange-700";
      case "Medium": return "bg-yellow-100 text-yellow-700";
      case "Low": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Emergency": return "🚨";
      case "Alert": return "⚠️";
      case "Update": return "📢";
      case "Announcement": return "📢";
      default: return "📢";
    }
  };

  // User search functionality
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const handleUserSelect = (user: User) => {
    if (!selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers(prev => [...prev, user]);
      setAnnouncementForm(prev => ({
        ...prev,
        targetUsers: [...prev.targetUsers, user._id]
      }));
    }
    setChatRecipient(user);
    // Load conversation for selected user
    setTimeout(() => {
      fetchMessages();
    }, 0);
  };

  const handleUserRemove = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u._id !== userId));
    setAnnouncementForm(prev => ({
      ...prev,
      targetUsers: prev.targetUsers.filter(id => id !== userId)
    }));
  };

  const handleSendDirectMessage = async (user: User) => {
    if (!directMessageContent.trim()) {
      toast({ title: "Message required", description: "Please type a message.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Optimistic UI update
      const optimistic = {
        _id: `temp-${Date.now()}`,
        fromUserId: currentUserId,
        toUserId: user._id,
        content: directMessageContent.trim(),
        createdAt: new Date().toISOString(),
      } as any;
      setMessages(prev => [...prev, optimistic]);

      await apiRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ toUserId: user._id, content: directMessageContent.trim() })
      });

      setDirectMessageContent("");
      toast({ title: "Message sent", description: `Message sent to ${user.name}.` });
      await fetchMessages();
    } catch (error) {
      toast({ title: "Failed to send message", description: error instanceof Error ? error.message : 'Please try again.', variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Messaging</h1>
          <p className="text-muted-foreground">Send announcements and manage system communications</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Announcement</TabsTrigger>
          <TabsTrigger value="direct">Direct Message</TabsTrigger>
          <TabsTrigger value="manage">Manage Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Announcement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Enter announcement title"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={announcementForm.type} onValueChange={(value) => setAnnouncementForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Announcement">Announcement</SelectItem>
                      <SelectItem value="Alert">Alert</SelectItem>
                      <SelectItem value="Update">Update</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Enter your message content"
                  rows={4}
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={announcementForm.priority} onValueChange={(value) => setAnnouncementForm(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expires At (Optional)</label>
                  <Input
                    type="datetime-local"
                    value={announcementForm.expiresAt}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isGlobal"
                    checked={announcementForm.isGlobal}
                    onCheckedChange={(checked) => setAnnouncementForm(prev => ({ ...prev, isGlobal: !!checked }))}
                  />
                  <label htmlFor="isGlobal" className="text-sm font-medium">
                    Send to all users
                  </label>
                </div>

                {!announcementForm.isGlobal && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Roles</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['admin', 'doctor', 'nurse', 'patient', 'family', 'volunteer'].map((role) => (
                          <div key={role} className="flex items-center space-x-2">
                            <Checkbox
                              id={role}
                              checked={announcementForm.targetRoles.includes(role)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setAnnouncementForm(prev => ({
                                    ...prev,
                                    targetRoles: [...prev.targetRoles, role]
                                  }));
                                } else {
                                  setAnnouncementForm(prev => ({
                                    ...prev,
                                    targetRoles: prev.targetRoles.filter(r => r !== role)
                                  }));
                                }
                              }}
                            />
                            <label htmlFor={role} className="text-sm capitalize">{role}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Specific Users</label>
                      <Dialog open={isUserSearchOpen} onOpenChange={setIsUserSearchOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <Search className="h-4 w-4 mr-2" />
                            {selectedUsers.length > 0 
                              ? `${selectedUsers.length} user(s) selected` 
                              : "Search and select users"
                            }
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Select Users</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search users by name, email, or role..."
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                              {filteredUsers.map((user) => (
                                <div key={user._id} className="flex items-center justify-between p-2 border border-border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{user.name}</p>
                                      <p className="text-sm text-muted-foreground">{user.email} • {user.role}</p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={selectedUsers.find(u => u._id === user._id) ? "default" : "outline"}
                                    onClick={() => handleUserSelect(user)}
                                    disabled={selectedUsers.find(u => u._id === user._id) !== undefined}
                                  >
                                    {selectedUsers.find(u => u._id === user._id) ? "Selected" : "Select"}
                                  </Button>
                                </div>
                              ))}
                            </div>
                            {selectedUsers.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Selected Users:</p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedUsers.map((user) => (
                                    <Badge key={user._id} variant="secondary" className="flex items-center gap-1">
                                      {user.name}
                                      <button
                                        onClick={() => handleUserRemove(user._id)}
                                        className="ml-1 hover:text-destructive"
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendImmediately"
                    checked={announcementForm.sendImmediately}
                    onCheckedChange={(checked) => setAnnouncementForm(prev => ({ ...prev, sendImmediately: !!checked }))}
                  />
                  <label htmlFor="sendImmediately" className="text-sm font-medium">
                    Send immediately
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateAnnouncement} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create Announcement
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setAnnouncementForm({
                  title: "",
                  message: "",
                  type: "Announcement",
                  priority: "Medium",
                  targetRoles: [],
                  targetUsers: [],
                  isGlobal: false,
                  expiresAt: "",
                  sendImmediately: false
                })}>
                  Clear Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="direct" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Direct Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search User</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name, email, or role..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message Details</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Message title"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Select value={announcementForm.type} onValueChange={(value) => setAnnouncementForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Announcement">Announcement</SelectItem>
                      <SelectItem value="Alert">Alert</SelectItem>
                      <SelectItem value="Update">Update</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Enter your message content"
                  rows={4}
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={announcementForm.priority} onValueChange={(value) => setAnnouncementForm(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium">Select Recipient:</p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredUsers.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email} • {user.role}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleSendDirectMessage(user)}
                        disabled={loading || !announcementForm.title || !announcementForm.message}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Announcements
                </CardTitle>
                <Button onClick={fetchAnnouncements} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
                    <p className="text-muted-foreground">Create your first announcement to get started.</p>
                  </div>
                ) : (
                  announcements.map((announcement) => (
                    <div key={announcement._id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getTypeIcon(announcement.type)}</span>
                          <div>
                            <h4 className="font-semibold text-lg">{announcement.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Created by {announcement.createdBy.name} • {new Date(announcement.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(announcement.status)}>
                            {announcement.status}
                          </Badge>
                          <Badge className={getPriorityColor(announcement.priority)}>
                            {announcement.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{announcement.message}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>
                            {announcement.isGlobal 
                              ? "All users" 
                              : announcement.targetRoles.length > 0 
                                ? announcement.targetRoles.join(", ")
                                : "Specific users"
                            }
                          </span>
                        </div>
                        {announcement.sentAt && (
                          <div className="flex items-center gap-1">
                            <Send className="h-4 w-4" />
                            <span>Sent: {new Date(announcement.sentAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {announcement.status === "Draft" && (
                          <Button 
                            size="sm" 
                            onClick={() => handleSendAnnouncement(announcement._id)}
                            disabled={loading}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Now
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
