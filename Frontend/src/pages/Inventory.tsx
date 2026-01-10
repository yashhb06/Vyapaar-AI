import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Mic, Plus, Search, Filter, Edit, Trash2, AlertTriangle, TrendingUp, Package, MicIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { inventoryAPI } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  lastUpdated?: any;
  threshold: number;
}

const Inventory = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [restockingProduct, setRestockingProduct] = useState<Product | null>(null);
  const [restockForm, setRestockForm] = useState({ quantity: "", price: "" });
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    quantity: "",
    category: "",
    unit: "pieces",
    threshold: "10"
  });

  // Fetch inventory
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await inventoryAPI.getAll();
      return response.data.data as Product[];
    }
  });

  const products = inventoryData || [];

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: (data: any) => inventoryAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsAddDialogOpen(false);
      setNewProduct({ name: "", price: "", quantity: "", category: "", unit: "pieces", threshold: "10" });
      toast({
        title: "Product Added!",
        description: "Inventory item has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add product",
        variant: "destructive"
      });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => inventoryAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Product Deleted",
        description: "Item has been removed from inventory",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  });

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.quantity) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    addProductMutation.mutate({
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      quantity: parseInt(newProduct.quantity),
      category: newProduct.category || "General",
      unit: newProduct.unit || "pieces",
      threshold: parseInt(newProduct.threshold) || 10
    });
  };

  // Restock mutation
  const restockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => inventoryAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsRestockDialogOpen(false);
      setRestockingProduct(null);
      setRestockForm({ quantity: "", price: "" });
      toast({ title: "Restocked!", description: "Inventory has been updated" });
    }
  });

  const handleRestock = (product: Product) => {
    setRestockingProduct(product);
    setRestockForm({ quantity: "", price: product.price.toString() });
    setIsRestockDialogOpen(true);
  };

  const handleRestockSubmit = () => {
    if (!restockingProduct || !restockForm.quantity) {
      toast({ title: "Missing Fields", description: "Please enter quantity", variant: "destructive" });
      return;
    }

    const newQuantity = restockingProduct.quantity + parseInt(restockForm.quantity);
    restockMutation.mutate({
      id: restockingProduct.id,
      data: { quantity: newQuantity, price: parseFloat(restockForm.price) || restockingProduct.price }
    });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(product => product.quantity <= product.threshold);

  const getStockStatus = (product: Product) => {
    if (product.quantity <= product.threshold) {
      return { status: "Low Stock", variant: "destructive" as const };
    } else if (product.quantity <= product.threshold * 1.5) {
      return { status: "Medium", variant: "secondary" as const };
    } else {
      return { status: "In Stock", variant: "default" as const };
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <main className="flex-1 overflow-auto">
          {/* Header */}
          <header className="bg-background border-b border-border p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
                  <p className="text-muted-foreground">Manage your stock efficiently</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary-muted text-primary">
                  {products.length} Products
                </Badge>
              </div>
            </div>
          </header>

          <div className="p-4 lg:p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                      <p className="text-2xl font-bold">{products.length}</p>
                    </div>
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                      <p className="text-2xl font-bold text-destructive">{lowStockProducts.length}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                      <p className="text-2xl font-bold">
                        ₹{products.reduce((sum, p) => sum + p.price * p.quantity, 0).toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
              <Card className="border-destructive bg-destructive/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    Low Stock Alert
                  </CardTitle>
                  <CardDescription>
                    {lowStockProducts.length} products are running low and need restocking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {lowStockProducts.map(product => (
                      <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-inherit">
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">Only {product.quantity} left</p>
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => handleRestock(product)}>
                          Restock
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search and Add */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="gradient" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                      <DialogDescription>
                        Manually add a new product to your inventory
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="productName">Product Name</Label>
                        <Input
                          id="productName"
                          placeholder="Enter product name"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Price (₹)</Label>
                          <Input
                            id="price"
                            type="number"
                            placeholder="0"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            placeholder="0"
                            value={newProduct.quantity}
                            onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            placeholder="e.g. Snacks, Beverages"
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="unit">Unit</Label>
                          <Select value={newProduct.unit} onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}>
                            <SelectTrigger id="unit">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pieces">Pieces</SelectItem>
                              <SelectItem value="kg">Kilograms (kg)</SelectItem>
                              <SelectItem value="g">Grams (g)</SelectItem>
                              <SelectItem value="L">Liters (L)</SelectItem>
                              <SelectItem value="mL">Milliliters (mL)</SelectItem>
                              <SelectItem value="m">Meters (m)</SelectItem>
                              <SelectItem value="boxes">Boxes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          placeholder="Enter category"
                          value={newProduct.category}
                          onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        />
                      </div>
                      <Button
                        className="w-full"
                        variant="hero"
                        onClick={handleAddProduct}
                        disabled={addProductMutation.isPending}
                      >
                        {addProductMutation.isPending ? "Adding..." : "Add Product"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Restock Dialog */}
                <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Restock Product</DialogTitle>
                      <DialogDescription>
                        Add more stock for {restockingProduct?.name || "this product"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Current Stock</p>
                            <p className="text-xl font-bold">{restockingProduct?.quantity || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">New Total</p>
                            <p className="text-xl font-bold text-success">
                              {(restockingProduct?.quantity || 0) + (parseInt(restockForm.quantity) || 0)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="restock-qty">Quantity to Add</Label>
                          <Input
                            id="restock-qty"
                            type="number"
                            placeholder="0"
                            value={restockForm.quantity}
                            onChange={(e) => setRestockForm({ ...restockForm, quantity: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="restock-price">Price per Unit (₹)</Label>
                          <Input
                            id="restock-price"
                            type="number"
                            placeholder="0"
                            value={restockForm.price}
                            onChange={(e) => setRestockForm({ ...restockForm, price: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-primary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Total Cost: <span className="font-bold text-primary">
                            ₹{((parseInt(restockForm.quantity) || 0) * (parseFloat(restockForm.price) || 0)).toLocaleString()}
                          </span>
                        </p>
                      </div>

                      <Button
                        className="w-full"
                        variant="success"
                        onClick={handleRestockSubmit}
                        disabled={restockMutation.isPending}
                      >
                        {restockMutation.isPending ? "Restocking..." : "Confirm Restock"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Products Table */}
            <Card>
              <CardHeader>
                <CardTitle>Product Inventory</CardTitle>
                <CardDescription>
                  Showing {filteredProducts.length} of {products.length} products
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading inventory...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No products found. Add your first product to get started!
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map(product => {
                          const stockStatus = getStockStatus(product);
                          return (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>{product.category}</TableCell>
                              <TableCell>₹{product.price}</TableCell>
                              <TableCell>{product.quantity}</TableCell>
                              <TableCell>
                                <Badge variant={stockStatus.variant}>
                                  {stockStatus.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="icon">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteProductMutation.mutate(product.id)}
                                    disabled={deleteProductMutation.isPending}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
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

export default Inventory;