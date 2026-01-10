import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IndianRupee, Search, Plus, Clock, CheckCircle, AlertTriangle, Mic } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { VoiceReminderButton } from "@/components/VoiceReminderButton";
import { ReminderCard } from "@/components/ReminderCard";
import { useToast } from "@/hooks/use-toast";
import { paymentsAPI } from "@/lib/api";
import { Reminder } from "@/types";

const Payments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any>(null);

  // Form state for Add/Edit
  const [reminderForm, setReminderForm] = useState({
    customerName: "",
    phone: "",
    amount: "",
    dueDate: "",
    notes: ""
  });

  // Fetch reminders
  const { data: remindersData, isLoading } = useQuery({
    queryKey: ['payment-reminders'],
    queryFn: async () => {
      const response = await paymentsAPI.getAll();
      return response.data.data || [];
    }
  });

  const reminders = remindersData || [];

  // Add reminder mutation
  const addReminderMutation = useMutation({
    mutationFn: (data: any) => paymentsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-reminders'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({ title: "Reminder Created!", description: "Payment reminder has been added successfully" });
    },
    onError: () => toast({ title: "Error", description: "Failed to create reminder", variant: "destructive" })
  });

  // Mark paid mutation
  const markPaidMutation = useMutation({
    mutationFn: (id: string) => paymentsAPI.markPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-reminders'] });
      toast({ title: "Payment Recorded", description: "Reminder marked as paid successfully" });
    }
  });

  // Delete mutation
  const deleteReminderMutation = useMutation({
    mutationFn: (id: string) => paymentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-reminders'] });
      toast({ title: "Reminder Deleted", description: "Payment reminder has been removed" });
    }
  });

  // Update reminder mutation
  const updateReminderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => paymentsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-reminders'] });
      setIsEditDialogOpen(false);
      setEditingReminder(null);
      toast({ title: "Reminder Updated!", description: "Payment reminder has been updated" });
    }
  });

  const handleReminderCreated = (reminder: Reminder) => {
    queryClient.invalidateQueries({ queryKey: ['payment-reminders'] });
  };

  const handleMarkPaid = (id: string) => {
    markPaidMutation.mutate(id);
  };

  const handleDeleteReminder = (id: string) => {
    deleteReminderMutation.mutate(id);
  };

  const handleEditReminder = (reminder: any) => {
    setEditingReminder(reminder);
    setReminderForm({
      customerName: reminder.customerName || "",
      phone: reminder.phone || "",
      amount: (reminder.amount || "").toString().replace(/[₹,]/g, ""),
      dueDate: reminder.dueDate || "",
      notes: reminder.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleAddReminder = () => {
    if (!reminderForm.customerName || !reminderForm.amount) {
      toast({ title: "Missing Fields", description: "Please fill in customer name and amount", variant: "destructive" });
      return;
    }

    addReminderMutation.mutate({
      customerName: reminderForm.customerName,
      phone: reminderForm.phone,
      amount: parseFloat(reminderForm.amount),
      dueDate: reminderForm.dueDate,
      notes: reminderForm.notes,
      status: "pending"
    });
  };

  const handleUpdateReminder = () => {
    if (!editingReminder) return;

    updateReminderMutation.mutate({
      id: editingReminder.id,
      data: {
        customerName: reminderForm.customerName,
        phone: reminderForm.phone,
        amount: parseFloat(reminderForm.amount),
        dueDate: reminderForm.dueDate,
        notes: reminderForm.notes
      }
    });
  };

  const resetForm = () => {
    setReminderForm({ customerName: "", phone: "", amount: "", dueDate: "", notes: "" });
  };

  const filteredReminders = reminders.filter((reminder: any) => {
    const matchesSearch = reminder.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.amount?.toString().includes(searchTerm);
    const matchesFilter = filterStatus === "all" || reminder.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusStats = () => {
    const pending = reminders.filter((r: any) => r.status === 'pending').length;
    const overdue = reminders.filter((r: any) => r.status === 'overdue').length;
    const paid = reminders.filter((r: any) => r.status === 'paid').length;
    const total = reminders.length;
    return { pending, overdue, paid, total };
  };

  const { pending, overdue, paid, total } = getStatusStats();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <main className="flex-1 overflow-auto">
          {/* Header */}
          <header className="bg-white dark:bg-card border-b border-border p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Payment Reminders</h1>
                  <p className="text-muted-foreground">Manage customer payment reminders</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-primary-muted text-primary">
                <IndianRupee className="w-3 h-3 mr-1" />
                {total} Active
              </Badge>
            </div>
          </header>

          <div className="p-4 lg:p-6 space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Reminders</p>
                      <p className="text-2xl font-bold">{total}</p>
                    </div>
                    <div className="bg-primary-muted p-3 rounded-lg">
                      <IndianRupee className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-warning">{pending}</p>
                    </div>
                    <div className="bg-warning/10 p-3 rounded-lg">
                      <Clock className="w-6 h-6 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                      <p className="text-2xl font-bold text-destructive">{overdue}</p>
                    </div>
                    <div className="bg-destructive/10 p-3 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Paid</p>
                      <p className="text-2xl font-bold text-success">{paid}</p>
                    </div>
                    <div className="bg-success/10 p-3 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-success" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Voice Reminder Section */}
            <Card className="bg-gradient-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Create Voice Payment Reminder
                </CardTitle>
                <CardDescription>
                  Speak naturally: "Send [Customer Name] a [Amount] reminder for [Date]"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VoiceReminderButton onReminderCreated={handleReminderCreated} variant="lg" />
              </CardContent>
            </Card>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Reminders</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by customer name or amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="filter">Filter by Status</Label>
                <div className="flex gap-2">
                  {['all', 'pending', 'overdue', 'paid'].map((status) => (
                    <Button
                      key={status}
                      variant={filterStatus === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus(status)}
                      className="capitalize"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reminders List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Payment Reminders ({filteredReminders.length})</h2>

                {/* Add Manual Reminder Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Manual Reminder
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Manual Reminder</DialogTitle>
                      <DialogDescription>Create a new payment reminder</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="customerName">Customer Name</Label>
                        <Input
                          id="customerName"
                          placeholder="Enter customer name"
                          value={reminderForm.customerName}
                          onChange={(e) => setReminderForm({ ...reminderForm, customerName: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            placeholder="+91 XXXXX XXXXX"
                            value={reminderForm.phone}
                            onChange={(e) => setReminderForm({ ...reminderForm, phone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount (₹)</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="0"
                            value={reminderForm.amount}
                            onChange={(e) => setReminderForm({ ...reminderForm, amount: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={reminderForm.dueDate}
                          onChange={(e) => setReminderForm({ ...reminderForm, dueDate: e.target.value })}
                        />
                      </div>
                      <Button
                        className="w-full"
                        variant="hero"
                        onClick={handleAddReminder}
                        disabled={addReminderMutation.isPending}
                      >
                        {addReminderMutation.isPending ? "Creating..." : "Create Reminder"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Edit Reminder Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingReminder(null); }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Reminder</DialogTitle>
                    <DialogDescription>Update payment reminder details</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-customerName">Customer Name</Label>
                      <Input
                        id="edit-customerName"
                        value={reminderForm.customerName}
                        onChange={(e) => setReminderForm({ ...reminderForm, customerName: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">Phone Number</Label>
                        <Input
                          id="edit-phone"
                          value={reminderForm.phone}
                          onChange={(e) => setReminderForm({ ...reminderForm, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-amount">Amount (₹)</Label>
                        <Input
                          id="edit-amount"
                          type="number"
                          value={reminderForm.amount}
                          onChange={(e) => setReminderForm({ ...reminderForm, amount: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-dueDate">Due Date</Label>
                      <Input
                        id="edit-dueDate"
                        type="date"
                        value={reminderForm.dueDate}
                        onChange={(e) => setReminderForm({ ...reminderForm, dueDate: e.target.value })}
                      />
                    </div>
                    <Button
                      className="w-full"
                      variant="hero"
                      onClick={handleUpdateReminder}
                      disabled={updateReminderMutation.isPending}
                    >
                      {updateReminderMutation.isPending ? "Updating..." : "Update Reminder"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading reminders...</div>
              ) : filteredReminders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Mic className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">No reminders found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || filterStatus !== 'all'
                        ? "Try adjusting your search or filter criteria."
                        : "Create your first payment reminder using the button above."
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredReminders.map((reminder: any) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onMarkPaid={handleMarkPaid}
                      onDelete={handleDeleteReminder}
                      onEdit={handleEditReminder}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Payments;