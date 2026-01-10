import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Store, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const CompleteSignup = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        shopName: "",
        ownerName: "",
        whatsappNumber: "",
        email: "",
        gstNumber: "",
        upiId: "",
        address: "",
        preferredLanguage: "en",
        businessType: "retail",
    });

    const navigate = useNavigate();
    const { user, completeSignup } = useAuth();

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.shopName || !formData.ownerName) {
            toast({
                title: "Missing Required Fields",
                description: "Shop name and owner name are required",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            await completeSignup({
                uid: user?.uid,
                shopName: formData.shopName,
                ownerName: formData.ownerName,
                phoneNumber: user?.phone,
                whatsappNumber: formData.whatsappNumber || user?.phone,
                email: formData.email,
                gstNumber: formData.gstNumber,
                upiId: formData.upiId,
                address: formData.address,
                preferredLanguage: formData.preferredLanguage,
                businessType: formData.businessType,
            });

            toast({
                title: "Profile Created!",
                description: "Welcome to Vyapaar - AI",
            });

            navigate("/dashboard");
        } catch (error: any) {
            toast({
                title: "Signup Failed",
                description: error.response?.data?.message || "Failed to create vendor profile",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
                    <p className="text-white/80">Tell us about your business</p>
                </div>

                <Card className="shadow-xl border-0 bg-white/95 backdrop-blur">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <Store className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl">Business Details</CardTitle>
                        <CardDescription>
                            Help us set up your account
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="shopName">Shop Name *</Label>
                                    <Input
                                        id="shopName"
                                        placeholder="e.g., Raj General Store"
                                        value={formData.shopName}
                                        onChange={(e) => handleChange("shopName", e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ownerName">Owner Name *</Label>
                                    <Input
                                        id="ownerName"
                                        placeholder="e.g., Rajesh Kumar"
                                        value={formData.ownerName}
                                        onChange={(e) => handleChange("ownerName", e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={user?.phone || ""}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp">WhatsApp Number</Label>
                                    <Input
                                        id="whatsapp"
                                        placeholder="Same as phone (optional)"
                                        value={formData.whatsappNumber}
                                        onChange={(e) => handleChange("whatsappNumber", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={(e) => handleChange("email", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gst">GST Number</Label>
                                    <Input
                                        id="gst"
                                        placeholder="Optional"
                                        value={formData.gstNumber}
                                        onChange={(e) => handleChange("gstNumber", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="upi">UPI ID</Label>
                                    <Input
                                        id="upi"
                                        placeholder="yourname@paytm"
                                        value={formData.upiId}
                                        onChange={(e) => handleChange("upiId", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="businessType">Business Type</Label>
                                    <Select value={formData.businessType} onValueChange={(value) => handleChange("businessType", value)}>
                                        <SelectTrigger id="businessType">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="retail">Retail</SelectItem>
                                            <SelectItem value="wholesale">Wholesale</SelectItem>
                                            <SelectItem value="service">Service</SelectItem>
                                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="language">Preferred Language</Label>
                                    <Select value={formData.preferredLanguage} onValueChange={(value) => handleChange("preferredLanguage", value)}>
                                        <SelectTrigger id="language">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    placeholder="Shop address (optional)"
                                    value={formData.address}
                                    onChange={(e) => handleChange("address", e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="hero"
                                size="lg"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? "Creating Profile..." : "Complete Setup"}
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CompleteSignup;
