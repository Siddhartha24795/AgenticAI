
'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMarketInsights } from '@/ai/flows/get-market-insights';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, Send, Play, StopCircle, LocateFixed } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '../ui/skeleton';
import { useLanguage } from '@/hooks/use-language';
import { getMarketData } from '@/services/market-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

const DUMMY_LOCATIONS = ["Bengaluru", "Pune", "Mumbai"];

export default function MarketComponent() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [audioResponseUri, setAudioResponseUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState<null | 'query' | 'location'>(null);
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

  const handleAnalyze = async (textQuery: string) => {
    if (!textQuery.trim() || !location) {
      toast({ title: t('common.error'), description: t('market.errorDescription'), variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    setAudioResponseUri(null);

    try {
      const marketData = await getMarketData(location);
      
      const insightsInput = {
        cropQuery: textQuery,
        location: location,
        marketData: JSON.stringify(marketData),
        language: languagePrompt,
      };

      const analysisPromise = getMarketInsights(insightsInput);
      
      const analysisResult = await analysisPromise;
      setResult(analysisResult.marketSummary);

      const speechPromise = textToSpeech({ text: analysisResult.marketSummary });

      toast({ title: t('common.success'), description: t('market.successDescription') });

      const speechResult = await speechPromise;
      setAudioResponseUri(speechResult.audioDataUri);

    } catch (error) {
      console.error("Error getting market analysis:", error);
      const errorMessage = (error as Error).message;
      setResult(`Error: ${errorMessage}. Please try again.`);
      toast({ title: t('common.analysisFailed'), description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = () => {
    handleAnalyze(query);
  };

  const handleUseMyLocation = () => {
    setLoading(true);
    toast({
      title: t('market.fetchingLocation'),
      description: t('market.fetchingLocationDesc'),
    });
    // Simulate fetching location
    setTimeout(() => {
      const simulatedLocation = "Bengaluru";
      setLocation(simulatedLocation);
      setLoading(false);
      const description = t('market.locationSetDesc').replace('{location}', simulatedLocation);
      toast({
        title: t('market.locationSetTitle'),
        description: description,
      });
    }, 1500);
  };

  const handleMicClick = (field: 'query' | 'location') => {
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
      setIsRecording(field);
      if (field === 'query') setQuery('');
      else setLocation('');
      toast({ title: t('common.listening'), description: `${t('common.speakNow')} ${languagePrompt}.`});
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (field === 'query') {
        setQuery(transcript);
        handleAnalyze(transcript);
      } else {
        setLocation(transcript);
      }
    };
    
    recognitionRef.current.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.error("Speech recognition error", event.error);
        toast({ title: t('common.speechError'), description: `${t('common.errorOccurred')} ${event.error}`, variant: "destructive" });
      }
    };

    recognitionRef.current.onend = () => {
      setIsRecording(null);
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
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="location-select">{t('market.locationTitle')}</Label>
                <div className="flex items-center gap-2">
                    <Select value={location} onValueChange={setLocation} disabled={loading}>
                        <SelectTrigger id="location-select">
                            <SelectValue placeholder={t('market.selectLocationPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {DUMMY_LOCATIONS.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Button variant="outline" size="icon" onClick={handleUseMyLocation} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <LocateFixed />}
                        <span className="sr-only">{t('market.useMyLocation')}</span>
                    </Button>
                </div>
                 <div className="relative">
                    <Input 
                      placeholder="Or type/speak location" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={loading}
                      className="pr-10"
                    />
                     <Button 
                      variant={isRecording === 'location' ? 'destructive' : 'ghost'} 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => handleMicClick('location')}
                      disabled={loading}
                     >
                        <Mic />
                        <span className="sr-only">Speak location</span>
                    </Button>
                </div>
            </div>
        </div>

        <div className="flex items-center space-x-2">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('market.queryPlaceholder')}
              className="min-h-[100px] flex-grow"
              disabled={loading || !location}
            />
             <Button onClick={handleTextSubmit} disabled={!query || !location || loading} size="icon" aria-label={t('market.textQueryAria')}>
                {loading && !result ? <Loader2 className="animate-spin" /> : <Send />}
              </Button>
              <Button 
                onClick={() => handleMicClick('query')}
                disabled={loading || !location}
                size="icon"
                variant={isRecording === 'query' ? 'destructive' : 'outline'}
                aria-label={t('market.audioQueryAria')}
              >
                {isRecording === 'query' ? <Loader2 className="animate-pulse" /> : <Mic />}
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
              <strong>{t('common.note')}:</strong> {t('market.realDataNote')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
