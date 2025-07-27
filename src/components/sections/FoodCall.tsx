
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
import { Send, UtensilsCrossed, Mic, Loader2, MessageSquarePlus, Sun, Sunset, Coffee, Cookie } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

export default function FoodCallComponent() {
  const { toast } = useToast();
  const { t, languageCode, languagePrompt } = useLanguage();
  const [otherMessage, setOtherMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleNotification = (type: string, message?: string) => {
    const mealType = t(`foodCall.${type.toLowerCase().replace(/\s/g, '')}Title`);
    const defaultMessageTemplate = t('foodCall.defaultMessage');
    const notificationMessage = message || defaultMessageTemplate.replace('{type}', mealType);

    console.log('Sending food call:', { type, message: notificationMessage });

    toast({
      title: t('foodCall.alertSentTitle'),
      description: t('foodCall.alertSentDesc').replace('{type}', mealType),
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

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: t('common.error'), description: t('common.speechRecognitionNotSupported'), variant: "destructive" });
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = languageCode;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      setOtherMessage('');
      toast({ title: t('common.listening'), description: `${t('common.speakNow')} ${languagePrompt}.`});
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setOtherMessage(transcript);
    };
    
    recognitionRef.current.onerror = (event: any) => {
       if (event.error !== 'no-speech') {
        console.error("Speech recognition error", event.error);
        toast({ title: t('common.speechError'), description: `${t('common.errorOccurred')} ${event.error}`, variant: "destructive" });
      }
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current.start();
  };

  return (
    <Card className="max-w-4xl mx-auto shadow-lg shadow-green-500/10">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl text-primary flex items-center justify-center gap-3">
          <UtensilsCrossed className="h-8 w-8" />
          {t('foodCall.title')}
        </CardTitle>
        <CardDescription className="text-lg text-foreground/80 mt-2 max-w-2xl mx-auto">
          {t('foodCall.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <button
            onClick={() => handleNotification('Breakfast')}
            className="p-6 bg-card rounded-lg shadow-md cursor-pointer transform hover:-translate-y-1 transition-transform duration-300 flex flex-col items-center text-center group border hover:border-yellow-500 hover:bg-yellow-50"
          >
            <Sun className="w-16 h-16 text-yellow-500 mb-4" />
            <h3 className="text-xl font-headline font-semibold text-card-foreground">
              {t('foodCall.breakfastTitle')}
            </h3>
          </button>
          <button
            onClick={() => handleNotification('Lunch')}
            className="p-6 bg-card rounded-lg shadow-md cursor-pointer transform hover:-translate-y-1 transition-transform duration-300 flex flex-col items-center text-center group border hover:border-orange-500 hover:bg-orange-50"
          >
            <UtensilsCrossed className="w-16 h-16 text-orange-500 mb-4" />
            <h3 className="text-xl font-headline font-semibold text-card-foreground">
              {t('foodCall.lunchTitle')}
            </h3>
          </button>
          <button
            onClick={() => handleNotification('Snacks')}
            className="p-6 bg-card rounded-lg shadow-md cursor-pointer transform hover:-translate-y-1 transition-transform duration-300 flex flex-col items-center text-center group border hover:border-blue-500 hover:bg-blue-50"
          >
            <Coffee className="w-16 h-16 text-blue-500 mb-4" />
            <h3 className="text-xl font-headline font-semibold text-card-foreground">
              {t('foodCall.snacksTitle')}
            </h3>
          </button>
          <button
            onClick={() => handleNotification('Dinner')}
            className="p-6 bg-card rounded-lg shadow-md cursor-pointer transform hover:-translate-y-1 transition-transform duration-300 flex flex-col items-center text-center group border hover:border-indigo-500 hover:bg-indigo-50"
          >
            <Sunset className="w-16 h-16 text-indigo-500 mb-4" />
            <h3 className="text-xl font-headline font-semibold text-card-foreground">
              {t('foodCall.dinnerTitle')}
            </h3>
          </button>
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full space-y-4">
            <h3 className="text-xl font-headline font-semibold text-card-foreground flex items-center gap-2">
                <MessageSquarePlus className="h-6 w-6 text-green-600" />
                {t('foodCall.otherTitle')}
            </h3>
            <div className="relative">
              <Textarea
                  placeholder={t('foodCall.otherPlaceholder')}
                  value={otherMessage}
                  onChange={(e) => setOtherMessage(e.target.value)}
                  className="min-h-[100px] pr-12"
              />
              <Button 
                onClick={handleMicClick}
                disabled={isRecording}
                size="icon"
                variant={isRecording ? 'destructive' : 'ghost'}
                aria-label={t('foodCall.recordMessageAria')}
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
                {t('foodCall.sendCustomAlert')}
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
