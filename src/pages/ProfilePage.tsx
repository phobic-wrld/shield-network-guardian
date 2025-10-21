
import { useState } from "react";
import  DashboardLayout  from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Settings, Loader2, Upload } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const ProfilePage = () => {
  const { profile, loading, updateProfile } = useProfile();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    
    const fullNameInput = document.getElementById('fullName') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const timezoneInput = document.getElementById('timezone') as HTMLInputElement;
    const languageInput = document.getElementById('language') as HTMLInputElement;
    
    const updates = {
      full_name: fullNameInput?.value || '',
      email: emailInput?.value || '',
      timezone: timezoneInput?.value || 'UTC',
      language: languageInput?.value || 'en',
    };

    const success = await updateProfile(updates);
    setIsUpdating(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="text-lg text-foreground">
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" disabled>
                  <Upload className="mr-2 h-4 w-4" />
                  Change Photo
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                  <Input 
                    id="fullName" 
                    placeholder="Enter your full name" 
                    defaultValue={profile?.full_name || ""}
                    className="text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter your email" 
                    defaultValue={profile?.email || ""}
                    className="text-foreground"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Settings className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Configure your account preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-foreground">Timezone</Label>
                <Input 
                  id="timezone" 
                  placeholder="Select timezone" 
                  defaultValue={profile?.timezone || "UTC"}
                  className="text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language" className="text-foreground">Language</Label>
                <Input 
                  id="language" 
                  placeholder="Select language" 
                  defaultValue={profile?.language || "English"}
                  className="text-foreground"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={handleSaveProfile}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
