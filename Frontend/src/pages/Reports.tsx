import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TrendingUp, TrendingDown, IndianRupee, Download, FileText, Lightbulb } from "lucide-react";
import { salesAPI, dashboardAPI } from "@/lib/api";

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("7days");

  // Fetch sales data
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales-stats', selectedPeriod],
    queryFn: async () => {
      const response = await salesAPI.getStats({ period: selectedPeriod });
      return response.data.data || {};
    }
  });

  // Fetch dashboard stats for summary
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await dashboardAPI.getStats();
      return response.data.data || {};
    }
  });

  const stats = salesData || {};
  const dashboard = dashboardData || {};

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
                  <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
                  <p className="text-muted-foreground">Business insights and performance metrics</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 3 Months</SelectItem>
                    <SelectItem value="1year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </header>

          <div className="p-4 lg:p-6 space-y-6">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading reports...</div>
            ) : (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                          <p className="text-2xl font-bold">
                            ₹{(stats.totalRevenue || dashboard.totalRevenue || 0).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="w-4 h-4 text-success" />
                            <span className="text-sm text-success">
                              {stats.revenueGrowth || "+0%"}
                            </span>
                          </div>
                        </div>
                        <IndianRupee className="w-8 h-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                          <p className="text-2xl font-bold">
                            {stats.totalOrders || dashboard.totalInvoices || 0}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="w-4 h-4 text-success" />
                            <span className="text-sm text-success">
                              {stats.ordersGrowth || "+0%"}
                            </span>
                          </div>
                        </div>
                        <FileText className="w-8 h-8 text-success" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                          <p className="text-2xl font-bold">
                            ₹{Math.round(stats.averageOrderValue || 0)}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <TrendingDown className="w-4 h-4 text-destructive" />
                            <span className="text-sm text-destructive">
                              {stats.avgOrderGrowth || "0%"}
                            </span>
                          </div>
                        </div>
                        <IndianRupee className="w-8 h-8 text-warning" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Products Sold</p>
                          <p className="text-2xl font-bold">
                            {stats.totalProductsSold || dashboard.totalProducts || 0}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="w-4 h-4 text-success" />
                            <span className="text-sm text-success">
                              {stats.productGrowth || "+0%"}
                            </span>
                          </div>
                        </div>
                        <TrendingUp className="w-8 h-8 text-success" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Summary Card */}
                <Card className="bg-gradient-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      Business Summary
                    </CardTitle>
                    <CardDescription>
                      Key performance indicators for your business
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border border-primary/20 bg-background/50">
                        <h4 className="font-semibold mb-2">Inventory Status</h4>
                        <p className="text-sm text-muted-foreground">
                          You have {dashboard.totalProducts || 0} products in inventory
                          {dashboard.lowStockItems > 0 && ` with ${dashboard.lowStockItems} items running low on stock`}.
                        </p>
                      </div>

                      <div className="p-4 rounded-lg border border-primary/20 bg-background/50">
                        <h4 className="font-semibold mb-2">Financial Overview</h4>
                        <p className="text-sm text-muted-foreground">
                          Total revenue: ₹{(dashboard.totalRevenue || 0).toLocaleString()}.
                          {dashboard.pendingPayments > 0 && ` ₹${dashboard.pendingPayments.toLocaleString()} in pending payments.`}
                        </p>
                      </div>

                      <div className="p-4 rounded-lg border border-primary/20 bg-background/50">
                        <h4 className="font-semibold mb-2">Sales Performance</h4>
                        <p className="text-sm text-muted-foreground">
                          {stats.totalOrders || 0} orders completed in the selected period.
                          Average order value is ₹{Math.round(stats.averageOrderValue || 0)}.
                        </p>
                      </div>

                      <div className="p-4 rounded-lg border border-primary/20 bg-background/50">
                        <h4 className="font-semibold mb-2">Growth Metrics</h4>
                        <p className="text-sm text-muted-foreground">
                          Revenue growth: {stats.revenueGrowth || "0%"}.
                          Order growth: {stats.ordersGrowth || "0%"} compared to previous period.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Export Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Export Reports
                    </CardTitle>
                    <CardDescription>
                      Download your business reports in different formats
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8" />
                        <span>Sales Report PDF</span>
                        <span className="text-xs text-muted-foreground">Detailed sales analysis</span>
                      </Button>

                      <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8" />
                        <span>Analytics CSV</span>
                        <span className="text-xs text-muted-foreground">Raw data for analysis</span>
                      </Button>

                      <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                        <IndianRupee className="w-8 h-8" />
                        <span>Financial Summary</span>
                        <span className="text-xs text-muted-foreground">Tax and accounting</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Reports;