
'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSchemeInformation } from '@/ai/flows/get-scheme-information';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '../ui/skeleton';
import { useLanguage } from '@/hooks/use-language';

const GOVERNMENT_SCHEME_DOCS = [
    {
        title: "Pradhan Mantri Krishi Sinchai Yojana (PMKSY) - Drip Irrigation",
        content: `The Pradhan Mantri Krishi Sinchai Yojana (PMKSY) aims to expand cultivated area under assured irrigation, improve on-farm water use efficiency to reduce wastage of water, enhance the adoption of precision irrigation (Drip and Sprinkler), recharge aquifers and introduce sustainable water conservation practices.
        Eligibility: All farmers are eligible. Priority is given to small and marginal farmers.
        Benefits: Financial assistance for installation of drip and sprinkler irrigation systems.
        Application Link: https://pmksy.gov.in/`
    },
    {
        title: "Soil Health Card Scheme",
        content: `The Soil Health Card (SHC) scheme is promoted by the Department of Agriculture & Farmers Welfare, Ministry of Agriculture & Farmers Welfare. It aims at promoting Integrated Nutrient Management (INM) through judicious use of chemicals and organic fertilizers including bio-fertilizers and also soil test based balanced use of fertilizers.
        Eligibility: All farmers with agricultural land.
        Benefits: Provides a detailed report on soil nutrient status and recommendations for fertilizer use.
        Application Link: https://soilhealth.dac.gov.in/`
    },
    {
        title: "Kisan Credit Card (KCC) Scheme",
        content: `The Kisan Credit Card (KCC) scheme provides adequate and timely credit support from the banking system to the farmers for their cultivation needs. This includes short term credit for crop production, post-harvest expenses, produce marketing loan, consumption requirements of farmer household, working capital for maintenance of farm assets and activities allied to agriculture, and investment credit for agriculture and allied activities.
        Eligibility: Farmers - individual/joint cultivators, tenant farmers, oral lessees & sharecroppers, SHGs/Joint Liability Groups of farmers.
        Benefits: Access to credit at low interest rates.
        Application Link: https://www.sbi.co.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card`
    }
];

export default function SchemesComponent() {
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

  const handleSearch = async (textQuery: string) => {
    if (!textQuery.trim()) {
      toast({ title: "Error", description: "Please enter a query for government schemes.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    setAudioResponseUri(null);

    try {
      const searchResult = await getSchemeInformation({
        schemeQuery: textQuery,
        schemeDocuments: GOVERNMENT_SCHEME_DOCS,
        language: languagePrompt,
      });
      const schemeInformation = searchResult.schemeInformation;
      setResult(schemeInformation);
      toast({ title: "Success", description: "Scheme information retrieved." });

      const speechResult = await textToSpeech({ text: schemeInformation });
      setAudioResponseUri(speechResult.audioDataUri);

    } catch (error) {
      console.error("Error getting scheme info:", error);
      setResult(`Error: ${(error as Error).message}. Please try again.`);
      toast({ title: "Search Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const handleTextSubmit = () => {
    handleSearch(query);
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
      handleSearch(transcript);
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
        <CardTitle className="font-headline text-2xl text-primary">Navigate Government Schemes</CardTitle>
        <CardDescription>Ask about government schemes to find eligibility and application info (e.g., "subsidies for drip irrigation").</CardDescription>
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
            <h3 className="text-lg font-headline font-semibold text-primary mb-2">Government Scheme Information:</h3>
             {loading && !result && <Skeleton className="h-20 w-full" />}
            {result && (
                <div className="text-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />').replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')}}></div>
            )}
             {audioResponseUri && (
                <div className="mt-4">
                    <audio ref={audioRef} src={audioResponseUri} controls className="w-full" />
                </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              <strong>Note:</strong> Scheme information is based on a predefined set of documents for this demo.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
