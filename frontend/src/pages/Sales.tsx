import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Plus, IndianRupee, TrendingUp, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { salesAPI } from "@/lib/api";

const Sales = () => {
    const queryClient = useQueryClient();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newSale, setNewSale] = useState({
        customerName: "",
        amount: "",
        items: "",
        paymentMethod: "cash",
        date: new Date().toISOString().split('T')[0]
    });

    // Fetch sales
    const { data: salesData, isLoading } = useQuery({
        queryKey: ['sales'],
        queryFn: async () => {
            const response = await salesAPI.getAll();
            return response.data.data || [];
        }
    });

    const sales = salesData || [];

    // Add sale mutation
    const addSaleMutation = useMutation({
        mutationFn: (data: any) => salesAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            setIsAddDialogOpen(false);
            setNewSale({ customerName: "", amount: "", items: "", paymentMethod: "cash", date: new Date().toISOString().split('T')[0] });
            toast({ title: "Sale Added!", description: "Sale has been recorded successfully" });
        }
    });

    const handleAddSale = () => {
        if (!newSale.amount) {
            toast({ title: "Missing Fields", description: "Please enter sale amount", variant: "destructive" });
            return;
        }

        const totalAmount = parseFloat(newSale.amount);

        // Create items array - parse comma-separated items string
        const itemsArray = newSale.items ?
            newSale.items.split(',').map(item => ({
                name: item.trim(),
                quantity: 1,
                price: totalAmount,
                total: totalAmount
            })) :
            [{ name: 'General Sale', quantity: 1, price: totalAmount, total: totalAmount }];

        addSaleMutation.mutate({
            customerName: newSale.customerName || "Walk-in Customer",
            items: itemsArray,
            totalAmount: totalAmount,
            paymentMethod: newSale.paymentMethod
        });
    };

    const totalSales = sales.reduce((sum: number, sale: any) => sum + (sale.totalAmount || sale.amount || 0), 0);

    // Filter today's sales - handle Firestore timestamps
    const todaySales = sales.filter((sale: any) => {
        try {
            // Firestore timestamps have a toDate() method
            let saleDate;
            if (sale.saleDate?.toDate) {
                saleDate = sale.saleDate.toDate();
            } else if (sale.saleDate) {
                saleDate = new Date(sale.saleDate);
            } else if (sale.createdAt?.toDate) {
                saleDate = sale.createdAt.toDate();
            } else {
                saleDate = new Date(sale.createdAt);
            }

            const today = new Date();
            return saleDate.toDateString() === today.toDateString();
        } catch (e) {
            console.error('Error filtering sale:', e, sale);
            return false;
        }
    });

    const todayTotal = todaySales.reduce((sum: number, sale: any) => sum + (sale.totalAmount || sale.amount || 0), 0);

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
                <AppSidebar />

                <main className="flex-1 overflow-auto">
                    <header className="border-b border-border p-4 lg:p-6 bg-inherit">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <SidebarTrigger />
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">Sales</h1>
                                    <p className="text-muted-foreground">Track and manage your sales transactions</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="p-4 lg:p-6 space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Today's Sales</p>
                                            <p className="text-2xl font-bold">₹{todayTotal.toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">{todaySales.length} transactions</p>
                                        </div>
                                        <div className="bg-primary-muted p-3 rounded-lg">
                                            <IndianRupee className="w-6 h-6 text-primary" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                                            <p className="text-2xl font-bold">₹{totalSales.toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">{sales.length} transactions</p>
                                        </div>
                                        <div className="bg-success/10 p-3 rounded-lg">
                                            <TrendingUp className="w-6 h-6 text-success" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Average Sale</p>
                                            <p className="text-2xl font-bold">₹{sales.length > 0 ? Math.round(totalSales / sales.length) : 0}</p>
                                            <p className="text-xs text-muted-foreground">Per transaction</p>
                                        </div>
                                        <div className="bg-warning/10 p-3 rounded-lg">
                                            <Calendar className="w-6 h-6 text-warning" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Add Sale Button */}
                        <div className="flex justify-end">
                            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="hero">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Sale
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Sale</DialogTitle>
                                        <DialogDescription>Record a new sales transaction</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="customerName">Customer Name (Optional)</Label>
                                            <Input
                                                id="customerName"
                                                placeholder="Walk-in Customer"
                                                value={newSale.customerName}
                                                onChange={(e) => setNewSale({ ...newSale, customerName: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="amount">Amount (₹)*</Label>
                                                <Input
                                                    id="amount"
                                                    type="number"
                                                    placeholder="0"
                                                    value={newSale.amount}
                                                    onChange={(e) => setNewSale({ ...newSale, amount: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="date">Date</Label>
                                                <Input
                                                    id="date"
                                                    type="date"
                                                    value={newSale.date}
                                                    onChange={(e) => setNewSale({ ...newSale, date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="items">Items (Optional)</Label>
                                            <Input
                                                id="items"
                                                placeholder="e.g., Maggi, Tea, Biscuits"
                                                value={newSale.items}
                                                onChange={(e) => setNewSale({ ...newSale, items: e.target.value })}
                                            />
                                        </div>
                                        <Button
                                            className="w-full"
                                            variant="hero"
                                            onClick={handleAddSale}
                                            disabled={addSaleMutation.isPending}
                                        >
                                            {addSaleMutation.isPending ? "Recording..." : "Record Sale"}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Sales Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Sales</CardTitle>
                                <CardDescription>All sales transactions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="text-center py-8 text-muted-foreground">Loading sales...</div>
                                ) : sales.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground mb-4">No sales recorded yet</p>
                                        <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add First Sale
                                        </Button>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Items</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Payment</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sales.map((sale: any) => (
                                                <TableRow key={sale.id}>
                                                    <TableCell>
                                                        {new Date(sale.saleDate || sale.date || sale.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>{sale.customerName || "Walk-in"}</TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {Array.isArray(sale.items) ? sale.items.map((i: any) => i.name).join(', ') : sale.items || "-"}
                                                    </TableCell>
                                                    <TableCell className="font-semibold">₹{(sale.totalAmount || sale.amount || 0).toLocaleString()}</TableCell>
                                                    <TableCell className="capitalize">{sale.paymentMethod || "cash"}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
};

export default Sales;
