import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Bell, Shield, User, Palette, Globe, Phone, Mail, AlertTriangle, Moon, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/hooks/useApi";
import { useTheme } from "@/contexts/ThemeContext";

interface SettingsProps {
  userRole: string;
}

export const Settings = ({ userRole }: SettingsProps) => {
  const { toast } = useToast();
  const { isDarkMode, toggleDarkMode, setDarkMode } = useTheme();
  const [effectiveRole, setEffectiveRole] = useState<string>(userRole);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [doctorSpecialty, setDoctorSpecialty] = useState("");
  const [doctorLicense, setDoctorLicense] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load existing profile and preferences for the current user (all roles)
  useEffect(() => {
    const load = async () => {
      try {
        // Profile
        const me = await apiRequest('/api/users/me');
        if (me) {
          const fullName: string = me.name || '';
          const parts = fullName.split(' ').filter(Boolean);
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
          setEmail(me.email || '');
          setPhone(me.phone || '');
          if (typeof me.role === 'string') setEffectiveRole(me.role);
        }
        const prefs = await apiRequest('/api/users/me/preferences');
        if (prefs) {
          if (typeof prefs.darkMode === 'boolean') setDarkMode(!!prefs.darkMode);
          if (prefs.notifications) {
            if (typeof prefs.notifications.push === 'boolean') setNotificationsEnabled(!!prefs.notifications.push);
            if (typeof prefs.notifications.email === 'boolean') setEmailNotifications(!!prefs.notifications.email);
            if (typeof prefs.notifications.sms === 'boolean') setSmsNotifications(!!prefs.notifications.sms);
          }
          if (typeof prefs.language === 'string') setLanguage(prefs.language);
          if (typeof prefs.timezone === 'string') setTimezone(prefs.timezone);
          if (prefs.doctor) {
            if (typeof prefs.doctor.specialty === 'string') setDoctorSpecialty(prefs.doctor.specialty);
            if (typeof prefs.doctor.license === 'string') setDoctorLicense(prefs.doctor.license);
          }
        }

        // Patient-specific: load Emergency Contact
        try {
          const selfPatient = await apiRequest('/api/patients/me/self');
          if (selfPatient && typeof selfPatient.emergencyContact === 'string') {
            setEmergencyContact(selfPatient.emergencyContact);
          }
        } catch {
          // ignore for non-patient roles
        }
      } catch (e) {
        // Ignore to keep page usable; toast on explicit save only
        console.error('Failed to load preferences', e);
      } finally {
        setInitialized(true);
      }
    };
    load();
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Save profile first
      await apiRequest('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          name: [firstName, lastName].filter(Boolean).join(' ').trim(),
          email: email.trim(),
          phone: phone.trim()
        })
      });

      // Then save preferences
      await apiRequest('/api/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          darkMode: isDarkMode,
          notifications: {
            email: emailNotifications,
            push: notificationsEnabled,
            sms: smsNotifications
          },
          language,
          timezone,
          preferences: effectiveRole === 'doctor' ? { doctor: { specialty: doctorSpecialty, license: doctorLicense } } : undefined
        })
      });

      // Patient-specific: save Emergency Contact
      if (effectiveRole === 'patient') {
        await apiRequest('/api/patients/me/self', {
          method: 'PUT',
          body: JSON.stringify({ emergencyContact })
        });
      }

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });

      // Reload after save to ensure no reversion
      await (async () => {
        try {
          const me = await apiRequest('/api/users/me');
          if (me) {
            const fullName: string = me.name || '';
            const parts = fullName.split(' ').filter(Boolean);
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
            setEmail(me.email || '');
            setPhone(me.phone || '');
            if (typeof me.role === 'string') setEffectiveRole(me.role);
          }
          const prefs = await apiRequest('/api/users/me/preferences');
          if (prefs) {
            if (typeof prefs.darkMode === 'boolean') setDarkMode(!!prefs.darkMode);
            if (prefs.notifications) {
              if (typeof prefs.notifications.push === 'boolean') setNotificationsEnabled(!!prefs.notifications.push);
              if (typeof prefs.notifications.email === 'boolean') setEmailNotifications(!!prefs.notifications.email);
              if (typeof prefs.notifications.sms === 'boolean') setSmsNotifications(!!prefs.notifications.sms);
            }
            if (typeof prefs.language === 'string') setLanguage(prefs.language);
            if (typeof prefs.timezone === 'string') setTimezone(prefs.timezone);
          }
          if (effectiveRole === 'patient') {
            try {
              const selfPatient = await apiRequest('/api/patients/me/self');
              if (selfPatient && typeof selfPatient.emergencyContact === 'string') {
                setEmergencyContact(selfPatient.emergencyContact);
              }
            } catch {}
          }
        } catch {}
      })();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error)?.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDarkModeToggle = async () => {
    const newDarkMode = !isDarkMode;
    setDarkMode(newDarkMode);
    
    try {
      await apiRequest('/api/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({ darkMode: newDarkMode })
      });

      toast({
        title: "Theme Updated",
        description: `Switched to ${newDarkMode ? 'dark' : 'light'} mode.`,
      });
    } catch (error) {
      console.error('Error updating dark mode preference:', error);
      toast({
        title: "Error",
        description: "Failed to save theme preference.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordReset = () => {
    toast({
      title: "Password Reset",
      description: "Password reset instructions sent to your email.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>
      </div>

      {initialized && effectiveRole !== userRole && (
        <div className="mb-4 p-3 border border-yellow-300 bg-yellow-50 rounded-md text-sm text-yellow-800">
          You are viewing the {userRole} route, but you are signed in as <strong>{effectiveRole}</strong>. The settings below reflect your signed-in account.
        </div>
      )}

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            {effectiveRole === 'patient' && (
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input id="emergencyContact" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications in the app</p>
              </div>
              <Switch 
                checked={notificationsEnabled} 
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch 
                checked={emailNotifications} 
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive text messages for urgent updates</p>
              </div>
              <Switch 
                checked={smsNotifications} 
                onCheckedChange={setSmsNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance & Language
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Switch to dark theme</p>
              </div>
              <div className="flex items-center gap-3">
                <Sun className={`h-4 w-4 ${!isDarkMode ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                <Switch checked={isDarkMode} onCheckedChange={handleDarkModeToggle} />
                <Moon className={`h-4 w-4 ${isDarkMode ? 'text-blue-500' : 'text-muted-foreground'}`} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="EST">Eastern Time</SelectItem>
                  <SelectItem value="PST">Pacific Time</SelectItem>
                  <SelectItem value="CST">Central Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Change Password</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Update your password to keep your account secure
              </p>
              <Button onClick={handlePasswordReset} variant="outline">
                Reset Password
              </Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Add an extra layer of security to your account
              </p>
              <Button variant="outline">Enable 2FA</Button>
            </div>
          </CardContent>
        </Card>

        {/* Role-specific Settings */}
        {effectiveRole === 'doctor' && (
          <Card>
            <CardHeader>
              <CardTitle>Doctor Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="specialty">Medical Specialty</Label>
                <Select value={doctorSpecialty} onValueChange={setDoctorSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardiology">Cardiology</SelectItem>
                    <SelectItem value="neurology">Neurology</SelectItem>
                    <SelectItem value="pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="orthopedics">Orthopedics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input id="licenseNumber" value={doctorLicense} onChange={(e) => setDoctorLicense(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        )}

        {effectiveRole === 'patient' && (
          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allergies">Known Allergies</Label>
                <Textarea 
                  id="allergies" 
                  placeholder="List any known allergies or medications to avoid"
                  defaultValue="Penicillin, Shellfish"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} className="px-8" disabled={loading}>
            {loading ? "Saving..." : (initialized ? "Save All Settings" : "Loading...")}
          </Button>
        </div>
      </div>
    </div>
  );
};