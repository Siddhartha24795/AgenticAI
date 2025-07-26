
'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMarketInsights } from '@/ai/flows/get-market-insights';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, Send, Play, MapPin, StopCircle, LocateFixed } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '../ui/skeleton';
import { useLanguage } from '@/hooks/use-language';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const DUMMY_MARKET_API_URL = 'https://dummyjson.com/products/1';
const CITIES_OF_INDIA = ["Mumbai", "Delhi", "Bengaluru", "Kolkata", "Chennai", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow"];

export default function MarketComponent() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [location, setLocation] = useState(CITIES_OF_INDIA[0]);
  const [audioResponseUri, setAudioResponseUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { languageCode, languagePrompt, t } = useLanguage();

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => setIsPlaying(false);
      audio.addEventListener('ended', handleEnded);
      return () => {
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioResponseUri]);

  const handleSimulateLocation = () => {
    toast({ title: t('market.fetchingLocation'), description: t('market.fetchingLocationDesc') });
    setTimeout(() => {
        setLocation("Bengaluru");
        toast({ title: t('market.locationSetTitle'), description: t('market.locationSetDesc') });
    }, 1500);
  };

  const handleAnalyze = async (textQuery: string) => {
    if (!textQuery.trim()) {
      toast({ title: t('common.error'), description: t('market.errorDescription'), variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    setAudioResponseUri(null);

    try {
      const marketResponse = await fetch(DUMMY_MARKET_API_URL);
      if (!marketResponse.ok) {
        throw new Error(`HTTP error! status: ${marketResponse.status}`);
      }
      const marketData = await marketResponse.json();

      const insightsInput = {
        cropQuery: textQuery,
        location: location,
        marketData: JSON.stringify(marketData),
        language: languagePrompt,
      };

      const analysisPromise = getMarketInsights(insightsInput);
      
      analysisPromise.then(res => {
        setResult(res.marketSummary);
        return textToSpeech({ text: res.marketSummary });
      }).then(speechResult => {
        setAudioResponseUri(speechResult.audioDataUri);
      }).catch(err => {
        console.error("Error during analysis or speech synthesis:", err);
        toast({ title: t('common.analysisFailed'), description: (err as Error).message, variant: "destructive" });
      });

      await analysisPromise;
      toast({ title: t('common.success'), description: t('market.successDescription') });

    } catch (error) {
      console.error("Error getting market analysis:", error);
      setResult(`Error: ${(error as Error).message}. Please try again.`);
      toast({ title: t('common.analysisFailed'), description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = () => {
    handleAnalyze(query);
  };

  const handleMicClick = () => {
    if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
    }
      
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
      setQuery('');
      toast({ title: t('common.listening'), description: `${t('common.speakNow')} ${languagePrompt}.`});
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleAnalyze(transcript);
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

  const handlePlayPause = () => {
    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">{t('market.title')}</CardTitle>
        <CardDescription>{t('market.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="location-select" className="flex items-center gap-2 font-semibold">
              <MapPin className="w-5 h-5 text-primary" />
              {t('market.locationTitle')}
            </Label>
            <div className="flex gap-2">
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger id="location-select">
                  <SelectValue placeholder={t('market.selectLocationPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {CITIES_OF_INDIA.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleSimulateLocation}>
                <LocateFixed className="mr-2 h-4 w-4" />
                {t('market.useMyLocation')}
              </Button>
            </div>
        </div>

        <div className="flex items-center space-x-2">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('market.queryPlaceholder')}
              className="min-h-[100px] flex-grow"
              disabled={loading}
            />
             <Button onClick={handleTextSubmit} disabled={!query || loading} size="icon" aria-label={t('market.textQueryAria')}>
                {loading ? <Loader2 className="animate-spin" /> : <Send />}
              </Button>
              <Button 
                onClick={handleMicClick}
                disabled={loading}
                size="icon"
                variant={isRecording ? 'destructive' : 'outline'}
                aria-label={t('market.audioQueryAria')}
              >
                {isRecording ? <Loader2 className="animate-pulse" /> : <Mic />}
              </Button>
        </div>
        
        {(loading || result) && (
          <div className="mt-6 p-4 bg-accent/20 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-headline font-semibold text-primary">{t('market.resultTitle')}</h3>
                {audioResponseUri && !loading && (
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePlayPause}
                    >
                    {isPlaying ? <StopCircle className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                    {isPlaying ? t('common.stopAudio') : t('common.playAudio')}
                    </Button>
                )}
            </div>
            {loading && !result && <Skeleton className="h-20 w-full" />}
            {result && (
                <div className="text-foreground whitespace-pre-wrap">{result}</div>
            )}
            {audioResponseUri && (
                <audio ref={audioRef} src={audioResponseUri} className="hidden" />
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              <strong>{t('common.note')}:</strong> {t('market.dummyDataNote')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
