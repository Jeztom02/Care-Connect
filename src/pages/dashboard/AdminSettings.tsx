import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Bell, Shield, AlertTriangle, Users, Save, RefreshCw, Loader2, Moon, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/hooks/useApi";
import { useTheme } from "@/contexts/ThemeContext";

interface SystemSetting {
  _id: string;
  key: string;
  value: any;
  category: string;
  description?: string;
  updatedBy: {
    name: string;
    email: string;
  };
  updatedAt: string;
}

export const AdminSettings = () => {
  const { toast } = useToast();
  const { isDarkMode, toggleDarkMode, setDarkMode } = useTheme();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");
  const [userPreferences, setUserPreferences] = useState({
    darkMode: false,
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  });

  // Form state for settings
  const [settingsForm, setSettingsForm] = useState({
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notificationFrequency: "immediate",
    
    // Security Settings
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireTwoFactor: false,
    
    // System Settings
    maintenanceMode: false,
    autoBackup: true,
    backupFrequency: "daily",
    logRetentionDays: 30,
    
    // Emergency Settings
    emergencyAlertThreshold: 5,
    emergencyEscalationTime: 15,
    emergencyContactEmail: "",
    emergencyContactPhone: "",
    
    // Role Settings
    allowRoleChanges: true,
    requireApprovalForNewUsers: false,
    defaultUserRole: "patient"
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [settingsData, preferences] = await Promise.all([
        apiRequest('/api/admin/settings'),
        apiRequest('/api/admin/user-preferences')
      ]);

      if (settingsData) {
        setSettings(Array.isArray(settingsData) ? settingsData : []);
        
        // Populate form with existing settings
        const formData: any = {};
        (Array.isArray(settingsData) ? settingsData : []).forEach((setting: SystemSetting) => {
          formData[setting.key] = setting.value;
        });
        setSettingsForm(prev => ({ ...prev, ...formData }));
      }

      if (preferences) {
        setUserPreferences(preferences);
        setDarkMode(!!preferences.darkMode);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveAllSettings = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(settingsForm);
      const updatePromises = entries.map(([key, value]) =>
        apiRequest(`/api/admin/settings/${encodeURIComponent(key)}`, {
          method: 'PUT',
          body: JSON.stringify({ value })
        })
      );

      const results = await Promise.allSettled(updatePromises);
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        throw new Error(`${failed.length} setting(s) failed to save`);
      }

      toast({
        title: "Success",
        description: `All settings saved successfully.`,
      });

      await fetchSettings();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error)?.message || "Failed to save all settings.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (category: string) => {
    setSaving(true);
    try {
      const categorySettings = getCategorySettings(category);
      const updatePromises = Object.entries(categorySettings).map(([key, value]) =>
        apiRequest(`/api/admin/settings/${encodeURIComponent(key)}`, {
          method: 'PUT',
          body: JSON.stringify({ value })
        })
      );

      const results = await Promise.allSettled(updatePromises);
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        throw new Error(`${failed.length} setting(s) failed to save`);
      }
      
      toast({
        title: "Success",
        description: `${category} settings saved successfully.`,
      });

      fetchSettings();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error)?.message || "Failed to save settings.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getCategorySettings = (category: string) => {
    switch (category) {
      case "notifications":
        return {
          emailNotifications: settingsForm.emailNotifications,
          smsNotifications: settingsForm.smsNotifications,
          pushNotifications: settingsForm.pushNotifications,
          notificationFrequency: settingsForm.notificationFrequency
        };
      case "security":
        return {
          sessionTimeout: settingsForm.sessionTimeout,
          maxLoginAttempts: settingsForm.maxLoginAttempts,
          passwordMinLength: settingsForm.passwordMinLength,
          requireTwoFactor: settingsForm.requireTwoFactor
        };
      case "system":
        return {
          maintenanceMode: settingsForm.maintenanceMode,
          autoBackup: settingsForm.autoBackup,
          backupFrequency: settingsForm.backupFrequency,
          logRetentionDays: settingsForm.logRetentionDays
        };
      case "emergency":
        return {
          emergencyAlertThreshold: settingsForm.emergencyAlertThreshold,
          emergencyEscalationTime: settingsForm.emergencyEscalationTime,
          emergencyContactEmail: settingsForm.emergencyContactEmail,
          emergencyContactPhone: settingsForm.emergencyContactPhone
        };
      case "roles":
        return {
          allowRoleChanges: settingsForm.allowRoleChanges,
          requireApprovalForNewUsers: settingsForm.requireApprovalForNewUsers,
          defaultUserRole: settingsForm.defaultUserRole
        };
      default:
        return {};
    }
  };

  const getSettingValue = (key: string) => {
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : settingsForm[key as keyof typeof settingsForm];
  };

  const getSettingDescription = (key: string) => {
    const setting = settings.find(s => s.key === key);
    return setting?.description || "";
  };

  const handleDarkModeToggle = async () => {
    const newDarkMode = !isDarkMode;
    setDarkMode(newDarkMode);
    
    try {
      const resp = await apiRequest('/api/admin/user-preferences', {
        method: 'PUT',
        body: JSON.stringify({ darkMode: newDarkMode })
      });

      if (resp) {
        toast({
          title: "Success",
          description: `Dark mode ${newDarkMode ? 'enabled' : 'disabled'}.`,
        });
      }
    } catch (error) {
      console.error('Error updating dark mode preference:', error);
      toast({
        title: "Error",
        description: "Failed to save dark mode preference.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
        </div>
        <div className="ml-auto">
          <Button onClick={handleSaveAllSettings} disabled={saving} variant="outline">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving All...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Settings
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                Appearance Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Sun className={`h-4 w-4 ${!isDarkMode ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={handleDarkModeToggle}
                  />
                  <Moon className={`h-4 w-4 ${isDarkMode ? 'text-blue-500' : 'text-muted-foreground'}`} />
                </div>
              </div>

              <div className="p-4 border border-border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Theme Preview</h4>
                <p className="text-sm text-muted-foreground">
                  Current theme: <span className="font-medium">{isDarkMode ? 'Dark' : 'Light'}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your preference is saved and will persist across sessions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.emailNotifications}
                    onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.smsNotifications}
                    onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, smsNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send push notifications in the app
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.pushNotifications}
                    onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notification Frequency</Label>
                  <Select value={settingsForm.notificationFrequency} onValueChange={(value) => setSettingsForm(prev => ({ ...prev, notificationFrequency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={() => handleSaveSettings("notifications")} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Notification Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={settingsForm.sessionTimeout}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 60 }))}
                    min="5"
                    max="480"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Login Attempts</Label>
                  <Input
                    type="number"
                    value={settingsForm.maxLoginAttempts}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) || 5 }))}
                    min="3"
                    max="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Password Minimum Length</Label>
                  <Input
                    type="number"
                    value={settingsForm.passwordMinLength}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) || 8 }))}
                    min="6"
                    max="20"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Force 2FA for all users
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.requireTwoFactor}
                    onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, requireTwoFactor: checked }))}
                  />
                </div>
              </div>

              <Button onClick={() => handleSaveSettings("security")} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Security Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable system access
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.maintenanceMode}
                    onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, maintenanceMode: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Backup</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable automatic system backups
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.autoBackup}
                    onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, autoBackup: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <Select value={settingsForm.backupFrequency} onValueChange={(value) => setSettingsForm(prev => ({ ...prev, backupFrequency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Log Retention (days)</Label>
                  <Input
                    type="number"
                    value={settingsForm.logRetentionDays}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, logRetentionDays: parseInt(e.target.value) || 30 }))}
                    min="7"
                    max="365"
                  />
                </div>
              </div>

              <Button onClick={() => handleSaveSettings("system")} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save System Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Emergency Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alert Threshold</Label>
                  <Input
                    type="number"
                    value={settingsForm.emergencyAlertThreshold}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, emergencyAlertThreshold: parseInt(e.target.value) || 5 }))}
                    min="1"
                    max="20"
                  />
                  <p className="text-sm text-muted-foreground">
                    Number of alerts before triggering emergency protocol
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Escalation Time (minutes)</Label>
                  <Input
                    type="number"
                    value={settingsForm.emergencyEscalationTime}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, emergencyEscalationTime: parseInt(e.target.value) || 15 }))}
                    min="5"
                    max="60"
                  />
                  <p className="text-sm text-muted-foreground">
                    Time before escalating emergency alerts
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Emergency Contact Email</Label>
                  <Input
                    type="email"
                    value={settingsForm.emergencyContactEmail}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, emergencyContactEmail: e.target.value }))}
                    placeholder="emergency@hospital.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Emergency Contact Phone</Label>
                  <Input
                    type="tel"
                    value={settingsForm.emergencyContactPhone}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <Button onClick={() => handleSaveSettings("emergency")} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Emergency Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Role Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Role Changes</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow administrators to change user roles
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.allowRoleChanges}
                    onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, allowRoleChanges: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Approval for New Users</Label>
                    <p className="text-sm text-muted-foreground">
                      New user registrations require admin approval
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.requireApprovalForNewUsers}
                    onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, requireApprovalForNewUsers: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Default User Role</Label>
                  <Select value={settingsForm.defaultUserRole} onValueChange={(value) => setSettingsForm(prev => ({ ...prev, defaultUserRole: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Default role assigned to new users
                  </p>
                </div>
              </div>

              <Button onClick={() => handleSaveSettings("roles")} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Role Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Current Settings Display */}
      {settings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Current Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {settings.map((setting) => (
                <div key={setting._id} className="p-3 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{setting.key}</span>
                    <Badge variant="outline">{setting.category}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    {typeof setting.value === 'boolean' 
                      ? (setting.value ? 'Enabled' : 'Disabled')
                      : String(setting.value)
                    }
                  </div>
                  {setting.description && (
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Updated by {setting.updatedBy.name} • {new Date(setting.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
