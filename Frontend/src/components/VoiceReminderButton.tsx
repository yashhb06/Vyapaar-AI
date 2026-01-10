import { useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Reminder } from "@/types";

interface VoiceReminderButtonProps {
  onReminderCreated?: (reminder: Reminder) => void;
  variant?: "default" | "sm" | "lg";
}

export function VoiceReminderButton({ onReminderCreated, variant = "default" }: VoiceReminderButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const startListening = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm' // Most browsers support this
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Create audio blob
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });

        // Process the audio
        await processVoiceInput(audioBlob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsListening(true);
      setTranscript("");
      setProgress(0);

      // Animate progress while recording
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 5;
        });
      }, 200);

      // Store interval for cleanup
      (recorder as any).progressInterval = interval;

    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use voice commands.",
        variant: "destructive",
      });
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      // Clear progress interval
      const interval = (mediaRecorder as any).progressInterval;
      if (interval) clearInterval(interval);

      mediaRecorder.stop();
      setIsListening(false);
      setProgress(100);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Get auth token
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Create FormData and append audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-command.webm');

      // Send to backend for processing - FIXED PORT TO 5000
      const response = await fetch('http://localhost:5000/api/voice/process-command', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process voice command');
      }

      const data = await response.json();

      // Set the transcribed text
      setTranscript(data.transcribedText || '');

      // Handle the result based on action type
      if (data.action === 'CREATE_PAYMENT_REMINDER' && data.data) {
        // Create reminder object matching the Reminder type
        const reminder: Reminder = {
          id: data.data.id,
          customerName: data.data.customerName,
          amount: `₹${data.data.amount}`,
          dueDate: new Date(data.data.dueDate).toLocaleDateString(),
          phone: data.data.phone || '',
          status: data.data.status,
          originalText: data.transcribedText,
          createdAt: new Date().toISOString()
        };

        onReminderCreated?.(reminder);
      }

      toast({
        title: "✅ Voice Command Processed",
        description: data.message || "Action completed successfully",
      });

    } catch (error: any) {
      console.error('Voice processing error:', error);
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process voice input. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  if (variant === "sm") {
    return (
      <Button
        size="sm"
        variant={isListening ? "destructive" : "gradient"}
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        className="gap-2"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isListening ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
        {isProcessing ? "Processing..." : isListening ? "Stop" : "Voice Reminder"}
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        variant={isListening ? "destructive" : "gradient"}
        size={variant === "lg" ? "lg" : "default"}
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        className="gap-2 w-full"
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
        {isProcessing ? "Processing Voice..." : isListening ? "Stop Recording" : "🎙️ Voice Payment Reminder"}
      </Button>

      {(isListening || isProcessing) && (
        <Card className="border-primary bg-primary-muted">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 bg-primary rounded-full flex items-center justify-center ${isListening ? 'animate-pulse' : ''}`}>
                <Mic className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-primary">
                    {isListening ? "Listening..." : "Processing..."}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {isListening ? "Recording" : "AI Processing"}
                  </Badge>
                </div>
                <p className="text-sm text-primary/80">
                  {isListening
                    ? 'Say: "Send [Customer] a [Amount] reminder for [Date]"'
                    : 'Extracting customer details...'
                  }
                </p>
              </div>
            </div>

            {transcript && (
              <div className="mb-3 p-2 bg-white/50 rounded text-sm">
                <strong>Heard:</strong> "{transcript}"
              </div>
            )}

            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}