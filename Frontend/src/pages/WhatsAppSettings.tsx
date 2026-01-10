import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MessageCircle, Settings, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { whatsappAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const WhatsAppSettings = () => {
  const queryClient = useQueryClient();
  const { vendor } = useAuth();

  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");

  // Fetch WhatsApp settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['whatsapp-settings'],
    queryFn: async () => {
      const response = await whatsappAPI.getSettings();
      return response.data.data || {};
    }
  });

  const settings = settingsData || {};

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => whatsappAPI.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-settings'] });
      toast({
        title: "Settings Saved!",
        description: "WhatsApp settings have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save settings",
        variant: "destructive"
      });
    }
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      autoReplyEnabled,
      offlineMessage,
      welcomeMessage,
      isConnected: settings.isConnected || false
    });
  };

  const isConnected = settings.isConnected || false;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <main className="flex-1 overflow-auto">
          {/* Header */}
          <header className="border-b border-border p-4 lg:p-6 bg-inherit">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">WhatsApp Assistant</h1>
                  <p className="text-muted-foreground">Configure auto-replies and message templates</p>
                </div>
              </div>
              <Badge variant={isConnected ? "default" : "destructive"} className="bg-success text-success-foreground">
                <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          </header>

          <div className="p-4 lg:p-6 space-y-6">
            {/* Connection Status */}
            <Card className={`${isConnected ? 'border-success bg-success-muted' : 'border-destructive bg-destructive/5'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isConnected ? 'bg-success' : 'bg-destructive'}`}>
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">WhatsApp Business API</h3>
                      <p className="text-sm text-muted-foreground">
                        {isConnected ? "Your WhatsApp is connected and ready to send automated messages" : "Connect your WhatsApp Business account to enable automation"}
                      </p>
                    </div>
                  </div>
                  <Button variant={isConnected ? "outline" : "hero"}>
                    {isConnected ? "Reconnect" : "Connect WhatsApp"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="settings" className="space-y-6">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Settings */}
              <TabsContent value="settings" className="space-y-6">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading settings...</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* General Settings */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            General Settings
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="autoReply">Auto Reply</Label>
                              <p className="text-sm text-muted-foreground">Automatically respond to messages</p>
                            </div>
                            <Switch
                              id="autoReply"
                              checked={autoReplyEnabled}
                              onCheckedChange={setAutoReplyEnabled}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="offlineMessage">Offline Message</Label>
                            <Textarea
                              id="offlineMessage"
                              placeholder="Message to send when offline..."
                              rows={3}
                              value={offlineMessage}
                              onChange={(e) => setOfflineMessage(e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Contact Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            Welcome Message
                          </CardTitle>
                          <CardDescription>
                            Message sent to new customers
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Business Name</Label>
                            <p className="font-medium">{vendor?.shopName || "Your Shop"}</p>
                          </div>

                          <div className="space-y-2">
                            <Label>Business Phone</Label>
                            <p className="font-medium">{vendor?.phoneNumber || "Not set"}</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="welcomeMessage">Welcome Message</Label>
                            <Textarea
                              id="welcomeMessage"
                              placeholder="Welcome message for new customers..."
                              rows={3}
                              value={welcomeMessage}
                              onChange={(e) => setWelcomeMessage(e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="hero"
                        size="lg"
                        onClick={handleSaveSettings}
                        disabled={updateSettingsMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default WhatsAppSettings;