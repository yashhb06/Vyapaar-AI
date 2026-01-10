import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, IndianRupee, AlertTriangle, Mic, FileText, MessageCircle, Package, Users, Calendar, BarChart3, Menu } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { VoiceReminderButton } from "@/components/VoiceReminderButton";
import { ReminderCard } from "@/components/ReminderCard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardAPI, inventoryAPI, paymentsAPI } from "@/lib/api";
import { Reminder, DashboardStats } from "@/types";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const [isListening, setIsListening] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const { toast } = useToast();
  const { vendor } = useAuth();

  // Fetch dashboard stats
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await dashboardAPI.getStats();
      return response.data.data as DashboardStats;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch inventory for AI insights
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await inventoryAPI.getAll();
      return response.data.data || [];
    }
  });

  // Fetch payments for AI insights
  const { data: paymentsData } = useQuery({
    queryKey: ['payment-reminders'],
    queryFn: async () => {
      const response = await paymentsAPI.getAll();
      return response.data.data || [];
    }
  });

  const stats = dashboardData ? [
    {
      title: "Today's Sales",
      value: `₹${dashboardData.todaySales.value.toLocaleString()}`,
      change: dashboardData.todaySales.change,
      isPositive: true,
      icon: IndianRupee,
      description: `${dashboardData.todaySales.transactions} transactions`
    },
    {
      title: "This Week",
      value: `₹${dashboardData.thisWeekSales.value.toLocaleString()}`,
      change: dashboardData.thisWeekSales.change,
      isPositive: true,
      icon: TrendingUp,
      description: `${dashboardData.thisWeekSales.transactions} transactions`
    },
    {
      title: "Pending Payments",
      value: `₹${dashboardData.pendingPayments.value.toLocaleString()}`,
      change: dashboardData.pendingPayments.change,
      isPositive: false,
      icon: AlertTriangle,
      description: "Due this week"
    },
    {
      title: "Low Stock Items",
      value: String(dashboardData.lowStockItems.count),
      change: "Action needed",
      isPositive: false,
      icon: Package,
      description: "Items below threshold"
    }
  ] : [];

  const quickActions = [{
    title: "Voice Add Inventory",
    description: "Add products using voice commands",
    icon: Mic,
    action: () => setIsListening(!isListening),
    variant: "gradient" as const,
    isActive: isListening
  }, {
    title: "Generate Invoice",
    description: "Create new bill for customer",
    icon: FileText,
    action: () => window.location.href = '/invoices',
    variant: "hero" as const
  }, {
    title: "Send Payment Reminder",
    description: "WhatsApp reminder to customers",
    icon: MessageCircle,
    action: () => window.location.href = '/payments',
    variant: "success" as const
  }, {
    title: "View Reports",
    description: "Business insights and analytics",
    icon: BarChart3,
    action: () => window.location.href = '/reports',
    variant: "premium" as const
  }];

  const recentActivity = dashboardData?.recentActivity || [];
  const handleVoiceCommand = () => {
    setIsListening(true);
    // Simulate voice recognition
    setTimeout(() => {
      setIsListening(false);
      // Here would be actual voice processing
    }, 3000);
  };
  const handleReminderCreated = (reminder: Reminder) => {
    setReminders(prev => [reminder, ...prev]);
  };
  const handleMarkPaid = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? {
      ...r,
      status: 'paid'
    } : r));
    toast({
      title: "Payment Recorded",
      description: "Reminder marked as paid successfully."
    });
  };
  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    toast({
      title: "Reminder Deleted",
      description: "Payment reminder has been removed."
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">Failed to load dashboard data</p>
          <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return <SidebarProvider>
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="border-b border-border p-4 lg:p-6 bg-inherit">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{vendor?.shopName || "Dashboard"}</h1>
                <p className="text-muted-foreground">Welcome back, {vendor?.ownerName || "User"}! Here's your business overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">\n              <Badge variant="outline" className="bg-success-muted text-success">
              <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
              Online
            </Badge>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              className="hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => window.location.href = '/sales'}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stats[0].title}</p>
                    <p className="text-2xl font-bold">{stats[0].value}</p>
                    <div className="flex items-center gap-1">
                      {stats[0].isPositive ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                      <span className={`text-sm ${stats[0].isPositive ? 'text-success' : 'text-destructive'}`}>
                        {stats[0].change}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{stats[0].description}</p>
                  </div>
                  <div className="bg-primary-muted p-3 rounded-lg">
                    <IndianRupee className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => window.location.href = '/sales'}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stats[1].title}</p>
                    <p className="text-2xl font-bold">{stats[1].value}</p>
                    <div className="flex items-center gap-1">
                      {stats[1].isPositive ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                      <span className={`text-sm ${stats[1].isPositive ? 'text-success' : 'text-destructive'}`}>
                        {stats[1].change}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{stats[1].description}</p>
                  </div>
                  <div className="bg-primary-muted p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => window.location.href = '/payments'}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stats[2].title}</p>
                    <p className="text-2xl font-bold">{stats[2].value}</p>
                    <div className="flex items-center gap-1">
                      {stats[2].isPositive ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                      <span className={`text-sm ${stats[2].isPositive ? 'text-success' : 'text-destructive'}`}>
                        {stats[2].change}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{stats[2].description}</p>
                  </div>
                  <div className="bg-primary-muted p-3 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => window.location.href = '/inventory'}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stats[3].title}</p>
                    <p className="text-2xl font-bold">{stats[3].value}</p>
                    <div className="flex items-center gap-1">
                      {stats[3].isPositive ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                      <span className={`text-sm ${stats[3].isPositive ? 'text-success' : 'text-destructive'}`}>
                        {stats[3].change}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{stats[3].description}</p>
                  </div>
                  <div className="bg-primary-muted p-3 rounded-lg">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Voice Recognition Card */}
          {isListening && <Card className="border-primary bg-primary-muted">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center animate-pulse">
                  <Mic className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">Listening...</h3>
                  <p className="text-sm text-primary/80">Say something like "Add 10 packets of Maggi noodles at 12 rupees each"</p>
                </div>
              </div>
              <Progress value={33} className="mt-4" />
            </CardContent>
          </Card>}

          {/* Voice Payment Reminder */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice Payment Reminders
            </h2>
            <VoiceReminderButton onReminderCreated={handleReminderCreated} />
          </div>

          {/* Active Reminders */}
          {reminders.length > 0 && <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Recent Payment Reminders</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reminders.slice(0, 2).map(reminder => <ReminderCard key={reminder.id} reminder={reminder} onMarkPaid={handleMarkPaid} onDelete={handleDeleteReminder} />)}
            </div>
          </div>}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => <Card key={index} className="hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={action.action}>
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${action.variant === 'gradient' ? 'bg-gradient-primary' : action.variant === 'hero' ? 'bg-gradient-hero' : action.variant === 'success' ? 'bg-gradient-success' : 'bg-gradient-card border border-primary/20'} group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
                {action.isActive && <Badge className="mt-2 bg-primary text-primary-foreground">Active</Badge>}
              </CardContent>
            </Card>)}
          </div>

          {/* Recent Activity & AI Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest transactions and updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'sale' ? 'bg-success text-success-foreground' : activity.type === 'payment' ? 'bg-primary text-primary-foreground' : activity.type === 'inventory' ? 'bg-warning text-warning-foreground' : 'bg-accent text-accent-foreground'}`}>
                      {activity.type === 'sale' ? <IndianRupee className="w-4 h-4" /> : activity.type === 'payment' ? <Users className="w-4 h-4" /> : activity.type === 'inventory' ? <Package className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.customer}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm">{activity.amount}</span>
                </div>)}
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="bg-gradient-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  AI Business Insights
                </CardTitle>
                <CardDescription>Smart recommendations for your business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const insights = [];
                  const lowStockProducts = (inventoryData || []).filter((p: any) => p.quantity <= (p.threshold || 10));
                  const pendingPayments = (paymentsData || []).filter((p: any) => p.status === 'pending' || p.status === 'overdue');

                  // Low Stock Insight
                  if (lowStockProducts.length > 0) {
                    const productNames = lowStockProducts.slice(0, 2).map((p: any) => p.name).join(', ');
                    insights.push(
                      <div key="stock" className="p-4 bg-white/50 rounded-lg">
                        <h4 className="font-semibold text-warning mb-2">⚠️ Stock Alert</h4>
                        <p className="text-sm text-muted-foreground">
                          {lowStockProducts.length === 1
                            ? `${productNames} is running low. Restock soon!`
                            : `${productNames} ${lowStockProducts.length > 2 ? `and ${lowStockProducts.length - 2} more items` : ''} are running low. Restock before they run out!`}
                        </p>
                      </div>
                    );
                  }

                  // Pending Payments Insight
                  if (pendingPayments.length > 0) {
                    insights.push(
                      <div key="payments" className="p-4 bg-white/50 rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">💡 Payment Reminder</h4>
                        <p className="text-sm text-muted-foreground">
                          {pendingPayments.length} customer{pendingPayments.length > 1 ? 's have' : ' has'} pending payments. Send WhatsApp reminders to improve cash flow.
                        </p>
                      </div>
                    );
                  }

                  // Sales Trend Insight
                  if (dashboardData?.todaySales?.value > 0) {
                    insights.push(
                      <div key="sales" className="p-4 bg-white/50 rounded-lg">
                        <h4 className="font-semibold text-success mb-2">📈 Today's Performance</h4>
                        <p className="text-sm text-muted-foreground">
                          You've made ₹{dashboardData.todaySales.value.toLocaleString()} in sales today. Keep up the great work!
                        </p>
                      </div>
                    );
                  }

                  // Default message if no insights
                  if (insights.length === 0) {
                    insights.push(
                      <div key="default" className="p-4 bg-white/50 rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">✨ All Good!</h4>
                        <p className="text-sm text-muted-foreground">
                          Your business is running smoothly. Keep recording sales and managing inventory!
                        </p>
                      </div>
                    );
                  }

                  return insights;
                })()}
                <Button variant="gradient" size="sm" className="w-full" onClick={() => window.location.href = '/reports'}>
                  View Detailed Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  </SidebarProvider>;
};
export default Dashboard;