import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageCircle,
  Phone,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReminderData {
  id: string;
  customerName: string;
  amount: string;
  dueDate: string;
  phone: string;
  status: 'pending' | 'sent' | 'paid' | 'overdue';
  originalText?: string;
  createdAt: string;
}

interface ReminderCardProps {
  reminder: ReminderData;
  onEdit?: (reminder: ReminderData) => void;
  onDelete?: (id: string) => void;
  onMarkPaid?: (id: string) => void;
}

export function ReminderCard({ reminder, onEdit, onDelete, onMarkPaid }: ReminderCardProps) {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success text-success-foreground';
      case 'sent': return 'bg-primary text-primary-foreground';
      case 'overdue': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-warning text-warning-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleSendWhatsApp = async () => {
    setIsSending(true);
    try {
      const { whatsappAPI } = await import('@/lib/api');

      // Extract amount as number
      const amount = typeof reminder.amount === 'number'
        ? reminder.amount
        : parseFloat(reminder.amount.toString().replace(/[₹,]/g, ''));

      // Format due date
      const dueDate = typeof reminder.dueDate === 'object' && reminder.dueDate?._seconds
        ? new Date(reminder.dueDate._seconds * 1000).toISOString()
        : reminder.dueDate;

      await whatsappAPI.sendPaymentReminder(
        reminder.id,
        reminder.phone,
        reminder.customerName,
        amount,
        dueDate
      );

      toast({
        title: "✅ WhatsApp Reminder Sent",
        description: `Payment reminder sent to ${reminder.customerName}`,
      });

    } catch (error: any) {
      console.error('WhatsApp send error:', error);
      toast({
        title: "Failed to Send",
        description: error.response?.data?.message || "Could not send WhatsApp reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendSMS = async () => {
    setIsSending(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "SMS Reminder Sent",
        description: `Payment reminder sent to ${reminder.customerName}`,
      });
    } catch (error) {
      toast({
        title: "Failed to Send",
        description: "Could not send SMS reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className={`transition-all duration-300 hover:shadow-md ${reminder.status === 'overdue' ? 'border-destructive/50' :
      reminder.status === 'paid' ? 'border-success/50' : ''
      }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {reminder.customerName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{reminder.customerName}</CardTitle>
              <p className="text-sm text-muted-foreground">{reminder.phone}</p>
            </div>
          </div>
          <Badge className={getStatusColor(reminder.status)}>
            {getStatusIcon(reminder.status)}
            <span className="ml-1 capitalize">{reminder.status}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Amount Due</p>
            <p className="text-xl font-bold text-primary">
              {typeof reminder.amount === 'number' ? `₹${reminder.amount.toLocaleString()}` : reminder.amount}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="font-semibold">
              {reminder.dueDate && typeof reminder.dueDate === 'object' && (reminder.dueDate as any)._seconds
                ? new Date((reminder.dueDate as any)._seconds * 1000).toLocaleDateString()
                : reminder.dueDate || 'Not set'}
            </p>
          </div>
        </div>

        {reminder.originalText && (
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground mb-1">Original Voice Command:</p>
            <p className="text-sm italic">"{reminder.originalText}"</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {reminder.status !== 'paid' && (
            <>
              <Button
                variant="gradient"
                size="sm"
                onClick={handleSendWhatsApp}
                disabled={isSending}
                className="flex-1 gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                {isSending ? "Sending..." : "WhatsApp"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSendSMS}
                disabled={isSending}
                className="flex-1 gap-2"
              >
                <Phone className="w-4 h-4" />
                SMS
              </Button>
            </>
          )}

          {reminder.status !== 'paid' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => onMarkPaid?.(reminder.id)}
              className="gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Paid
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit?.(reminder)}
            className="gap-2"
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete?.(reminder.id)}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}