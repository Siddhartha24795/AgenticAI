
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Flame, Waves, HeartPulse, MessageSquareWarning, Send, BellRing, Mic, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

export default function NotifyComponent() {
  const { toast } = useToast();
  const [otherMessage, setOtherMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { languageCode, languagePrompt } = useLanguage();

  const handleNotification = (type: string, message?: string) => {
    const notificationMessage =
      message || `Immediate assistance required due to ${type}.`;
    console.log('Sending notification:', { type, message: notificationMessage });

    toast({
      title: 'Alert Sent!',
      description: `${type} notification has been broadcast to nearby authorities and farmers.`,
      variant: 'destructive',
      duration: 5000,
    });

    if (type === 'Other') {
      setOtherMessage('');
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Error", description: "Speech recognition is not supported in this browser.", variant: "destructive" });
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = languageCode;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      setOtherMessage('');
      toast({ title: "Listening...", description: `Please speak your emergency message in ${languagePrompt}.`});
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setOtherMessage(transcript);
    };
    
    recognitionRef.current.onerror = (event: any) => {
       if (event.error !== 'no-speech') {
        console.error("Speech recognition error", event.error);
        toast({ title: "Speech Error", description: `An error occurred: ${event.error}`, variant: "destructive" });
      }
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current.start();
  };

  return (
    <Card className="max-w-4xl mx-auto border-destructive/50 shadow-lg shadow-destructive/20">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl text-destructive flex items-center justify-center gap-3">
          <BellRing className="h-8 w-8" />
          Emergency Notifier
        </CardTitle>
        <CardDescription className="text-lg text-foreground/80 mt-2 max-w-2xl mx-auto">
          Instantly alert authorities and nearby farmers in case of an
          emergency. Use this feature responsibly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => handleNotification('Fire')}
            className="p-6 bg-card rounded-lg shadow-md cursor-pointer transform hover:-translate-y-1 transition-transform duration-300 flex flex-col items-center text-center group border hover:border-red-500 hover:bg-red-50"
          >
            <Flame className="w-16 h-16 text-red-500 mb-4" />
            <h3 className="text-xl font-headline font-semibold text-card-foreground">
              Fire Alert
            </h3>
            <p className="text-card-foreground/70 mt-2 text-sm">
              Notify about a fire outbreak.
            </p>
          </button>
          <button
            onClick={() => handleNotification('Flood')}
            className="p-6 bg-card rounded-lg shadow-md cursor-pointer transform hover:-translate-y-1 transition-transform duration-300 flex flex-col items-center text-center group border hover:border-blue-500 hover:bg-blue-50"
          >
            <Waves className="w-16 h-16 text-blue-500 mb-4" />
            <h3 className="text-xl font-headline font-semibold text-card-foreground">
              Flood Warning
            </h3>
            <p className="text-card-foreground/70 mt-2 text-sm">
              Warn about rising water levels.
            </p>
          </button>
          <button
            onClick={() => handleNotification('Medical Emergency')}
            className="p-6 bg-card rounded-lg shadow-md cursor-pointer transform hover:-translate-y-1 transition-transform duration-300 flex flex-col items-center text-center group border hover:border-green-500 hover:bg-green-50"
          >
            <HeartPulse className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-xl font-headline font-semibold text-card-foreground">
              Medical Emergency
            </h3>
            <p className="text-card-foreground/70 mt-2 text-sm">
              Request urgent medical help.
            </p>
          </button>
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full space-y-4">
            <h3 className="text-xl font-headline font-semibold text-card-foreground flex items-center gap-2">
                <MessageSquareWarning className="h-6 w-6 text-yellow-600" />
                Other Emergency
            </h3>
            <div className="relative">
              <Textarea
                  placeholder="Describe the emergency here, or use the microphone..."
                  value={otherMessage}
                  onChange={(e) => setOtherMessage(e.target.value)}
                  className="min-h-[100px] pr-12"
              />
              <Button 
                onClick={handleMicClick}
                disabled={isRecording}
                size="icon"
                variant={isRecording ? 'destructive' : 'ghost'}
                aria-label="Record emergency message"
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {isRecording ? <Loader2 className="animate-pulse" /> : <Mic />}
              </Button>
            </div>
            <Button
                onClick={() => handleNotification('Other', otherMessage)}
                disabled={!otherMessage.trim()}
                className="w-full"
            >
                <Send className="mr-2 h-4 w-4" />
                Send Custom Alert
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
