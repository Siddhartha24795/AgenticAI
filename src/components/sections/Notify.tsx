
'use client';

import { useState } from 'react';
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
import { Flame, Waves, HeartPulse, MessageSquareWarning, Send } from 'lucide-react';

export default function NotifyComponent() {
  const { toast } = useToast();
  const [otherMessage, setOtherMessage] = useState('');

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
            <Textarea
                placeholder="Describe the emergency here..."
                value={otherMessage}
                onChange={(e) => setOtherMessage(e.target.value)}
                className="min-h-[100px]"
            />
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
