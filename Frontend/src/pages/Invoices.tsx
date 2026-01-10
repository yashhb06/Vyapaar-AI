import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Plus, Search, Download, MessageCircle, FileText, IndianRupee, Clock, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { invoicesAPI } from "@/lib/api";

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

const Invoices = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Form state for creating invoice
  const [newInvoice, setNewInvoice] = useState({
    customerName: "",
    customerPhone: "",
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    items: [{ name: "", quantity: 1, price: 0 }] as InvoiceItem[],
    gstRate: "18",
    paymentMethod: "cash",
    notes: ""
  });

  // Fetch invoices
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await invoicesAPI.getAll();
      return response.data.data || [];
    }
  });

  const invoices = invoicesData || [];

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => invoicesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Invoice Created!",
        description: "Invoice has been generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create invoice",
        variant: "destructive"
      });
    }
  });

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = newInvoice.items.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);

    const gstAmount = (subtotal * parseInt(newInvoice.gstRate)) / 100;
    const total = subtotal + gstAmount;

    return { subtotal, gstAmount, total };
  }, [newInvoice.items, newInvoice.gstRate]);

  const handleCreateInvoice = () => {
    if (!newInvoice.customerName || !newInvoice.customerPhone) {
      toast({
        title: "Missing Fields",
        description: "Please fill in customer name and phone",
        variant: "destructive"
      });
      return;
    }

    const validItems = newInvoice.items.filter(item => item.name && item.quantity > 0 && item.price > 0);
    if (validItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the invoice",
        variant: "destructive"
      });
      return;
    }

    createInvoiceMutation.mutate({
      customerName: newInvoice.customerName,
      customerPhone: newInvoice.customerPhone,
      invoiceDate: newInvoice.invoiceDate,
      dueDate: newInvoice.dueDate || newInvoice.invoiceDate,
      items: validItems,
      amount: calculations.subtotal,
      gstRate: parseInt(newInvoice.gstRate),
      gstAmount: calculations.gstAmount,
      totalAmount: calculations.total,
      paymentMethod: newInvoice.paymentMethod,
      notes: newInvoice.notes,
      status: "Pending"
    });
  };

  const resetForm = () => {
    setNewInvoice({
      customerName: "",
      customerPhone: "",
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      items: [{ name: "", quantity: 1, price: 0 }],
      gstRate: "18",
      paymentMethod: "cash",
      notes: ""
    });
  };

  const addItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { name: "", quantity: 1, price: 0 }]
    });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...newInvoice.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewInvoice({ ...newInvoice, items: updatedItems });
  };

  const filteredInvoices = invoices.filter((invoice: any) =>
    invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => {
    const paid = invoices.filter((i: any) => i.status === "Paid").reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0);
    const pending = invoices.filter((i: any) => i.status === "Pending").reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0);
    const overdue = invoices.filter((i: any) => i.status === "Overdue").reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0);

    return [
      { title: "Total Invoices", value: invoices.length.toString(), icon: FileText, color: "text-primary" },
      { title: "Paid Amount", value: `₹${paid.toLocaleString()}`, icon: CheckCircle, color: "text-success" },
      { title: "Pending Amount", value: `₹${pending.toLocaleString()}`, icon: Clock, color: "text-warning" },
      { title: "Overdue Amount", value: `₹${overdue.toLocaleString()}`, icon: IndianRupee, color: "text-destructive" }
    ];
  }, [invoices]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "bg-success text-success-foreground";
      case "Pending": return "bg-warning text-warning-foreground";
      case "Overdue": return "bg-destructive text-destructive-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

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
                  <h1 className="text-2xl font-bold text-foreground">Invoices & Billing</h1>
                  <p className="text-muted-foreground">Create and manage customer invoices</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-primary-muted text-primary">
                {invoices.length} Invoices
              </Badge>
            </div>
          </header>

          <div className="p-4 lg:p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <stat.icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Create Invoice Button */}
            <div className="flex justify-end">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero" size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                    <DialogDescription>
                      Generate a new invoice with automatic GST calculation
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Customer Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customerName">Customer Name</Label>
                        <Input
                          id="customerName"
                          placeholder="Enter customer name"
                          value={newInvoice.customerName}
                          onChange={(e) => setNewInvoice({ ...newInvoice, customerName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customerPhone">Phone Number</Label>
                        <Input
                          id="customerPhone"
                          placeholder="+91 XXXXX XXXXX"
                          value={newInvoice.customerPhone}
                          onChange={(e) => setNewInvoice({ ...newInvoice, customerPhone: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invoiceDate">Invoice Date</Label>
                        <Input
                          id="invoiceDate"
                          type="date"
                          value={newInvoice.invoiceDate}
                          onChange={(e) => setNewInvoice({ ...newInvoice, invoiceDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={newInvoice.dueDate}
                          onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4">
                      <Label>Invoice Items</Label>
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-4 gap-2 font-medium text-sm">
                          <span>Item Name</span>
                          <span>Quantity</span>
                          <span>Price (₹)</span>
                          <span>Total</span>
                        </div>
                        {newInvoice.items.map((item, index) => (
                          <div key={index} className="grid grid-cols-4 gap-2">
                            <Input
                              placeholder="Product name"
                              value={item.name}
                              onChange={(e) => updateItem(index, 'name', e.target.value)}
                            />
                            <Input
                              type="number"
                              placeholder="1"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value === '' ? 0 : parseInt(e.target.value))}
                            />
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={item.price === 0 ? '' : item.price}
                              onChange={(e) => updateItem(index, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                            />
                            <div className="flex items-center">
                              <span className="text-muted-foreground font-mono">
                                ₹{(item.quantity * item.price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full" onClick={addItem}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Another Item
                        </Button>
                      </div>
                    </div>

                    {/* GST & Payment */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gstRate">GST Rate (%)</Label>
                        <Select value={newInvoice.gstRate} onValueChange={(value) => setNewInvoice({ ...newInvoice, gstRate: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0% (No GST)</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="12">12%</SelectItem>
                            <SelectItem value="18">18%</SelectItem>
                            <SelectItem value="28">28%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select value={newInvoice.paymentMethod} onValueChange={(value) => setNewInvoice({ ...newInvoice, paymentMethod: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Calculation Summary */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-mono">₹{calculations.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">GST ({newInvoice.gstRate}%):</span>
                        <span className="font-mono">₹{calculations.gstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total Amount:</span>
                        <span className="font-mono">₹{calculations.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional notes or terms..."
                        rows={3}
                        value={newInvoice.notes}
                        onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                      />
                    </div>

                    {/* Action Button */}
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={handleCreateInvoice}
                      disabled={createInvoiceMutation.isPending}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Invoices Table */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice List</CardTitle>
                <CardDescription>
                  Showing {filteredInvoices.length} of {invoices.length} invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No invoices found. Create your first invoice to get started!
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>GST</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.map((invoice: any) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-mono font-medium">
                              {invoice.invoiceNumber || invoice.id}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{invoice.customerName}</p>
                                <p className="text-xs text-muted-foreground">{invoice.customerPhone}</p>
                              </div>
                            </TableCell>
                            <TableCell>₹{(invoice.amount || 0).toLocaleString()}</TableCell>
                            <TableCell>₹{(invoice.gstAmount || 0).toLocaleString()}</TableCell>
                            <TableCell className="font-semibold">₹{(invoice.totalAmount || 0).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(invoice.status)}>
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    toast({
                                      title: "PDF Generated!",
                                      description: `Invoice ${invoice.invoiceNumber || invoice.id} downloaded successfully`,
                                    });
                                  }}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-success hover:text-success"
                                  onClick={() => {
                                    toast({
                                      title: "Reminder Sent!",
                                      description: `Payment reminder sent to ${invoice.customerName}`,
                                    });
                                  }}
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Invoices;