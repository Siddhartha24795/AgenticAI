
'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMarketInsights } from '@/ai/flows/get-market-insights';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '../ui/skeleton';
import { useLanguage } from '@/hooks/use-language';

const DUMMY_MARKET_API_URL = 'https://dummyjson.com/products/1';

export default function MarketComponent() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [audioResponseUri, setAudioResponseUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { languageCode, languagePrompt } = useLanguage();
  
  useEffect(() => {
    if (audioResponseUri && audioRef.current) {
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [audioResponseUri]);

  const handleAnalyze = async (textQuery: string) => {
    if (!textQuery.trim()) {
      toast({ title: "Error", description: "Please enter a query for market analysis.", variant: "destructive" });
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

      const analysisResult = await getMarketInsights({
        cropQuery: textQuery,
        marketData: JSON.stringify(marketData),
        language: languagePrompt,
      });
      const marketSummary = analysisResult.marketSummary;
      setResult(marketSummary);
      toast({ title: "Success", description: "Market analysis complete." });

      const speechResult = await textToSpeech({ text: marketSummary });
      setAudioResponseUri(speechResult.audioDataUri);

    } catch (error) {
      console.error("Error getting market analysis:", error);
      setResult(`Error: ${(error as Error).message}. Please try again.`);
      toast({ title: "Analysis Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = () => {
    handleAnalyze(query);
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
      setQuery('');
      toast({ title: "Listening...", description: `Please speak your query in ${languagePrompt}.`});
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleAnalyze(transcript);
    };
    
    recognitionRef.current.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.error("Speech recognition error", event.error);
        toast({ title: "Speech Error", description: `An error occurred: ${event.error}`, variant: "destructive" });
      }
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current.start();
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">Real-Time Market Analysis</CardTitle>
        <CardDescription>Ask about market prices to guide your selling decisions (e.g., "What is the price of tomatoes today?").</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query here..."
              className="min-h-[100px] flex-grow"
              disabled={loading}
            />
             <Button onClick={handleTextSubmit} disabled={!query || loading} size="icon" aria-label="Submit text query">
                {loading ? <Loader2 className="animate-spin" /> : <Send />}
              </Button>
              <Button 
                onClick={handleMicClick}
                disabled={loading}
                size="icon"
                variant={isRecording ? 'destructive' : 'outline'}
                aria-label="Submit audio query"
              >
                {isRecording ? <Loader2 className="animate-pulse" /> : <Mic />}
              </Button>
        </div>
        
        {(loading || result || audioResponseUri) && (
          <div className="mt-6 p-4 bg-accent/20 border rounded-lg">
            <h3 className="text-lg font-headline font-semibold text-primary mb-2">Market Analysis:</h3>
            {loading && !result && <Skeleton className="h-20 w-full" />}
            {result && (
                <div className="text-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }}></div>
            )}
            {audioResponseUri && (
                <div className="mt-4">
                    <audio ref={audioRef} src={audioResponseUri} controls className="w-full" />
                </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              <strong>Note:</strong> Market data is from a dummy source for demonstration purposes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
