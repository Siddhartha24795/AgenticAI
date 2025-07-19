
'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSchemeInformation } from '@/ai/flows/get-scheme-information';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, Send, Play } from 'lucide-react';
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

function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  // Remove HTML tags
  let cleanedText = text.replace(/<[^>]*>?/gm, ' ');
  // Remove URLs
  cleanedText = cleanedText.replace(/(https?:\/\/[^\s]+)/g, ' ');
  // Replace multiple newlines/spaces with a single space
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  return cleanedText;
}

export default function SchemesComponent() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [audioResponseUri, setAudioResponseUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { languageCode, languagePrompt } = useLanguage();

  const handleSearch = async (textQuery: string) => {
    if (!textQuery.trim()) {
      toast({ title: "Error", description: "Please enter a query for government schemes.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    setAudioResponseUri(null);

    try {
        const searchInput = {
            schemeQuery: textQuery,
            schemeDocuments: GOVERNMENT_SCHEME_DOCS,
            language: languagePrompt,
        };

        const searchPromise = getSchemeInformation(searchInput);

        const searchResult = await searchPromise;
        const schemeInformation = searchResult.schemeInformation;
        setResult(schemeInformation);
        
        const textForSpeech = cleanTextForSpeech(schemeInformation);
        const speechPromise = textToSpeech({ text: textForSpeech });
        
        toast({ title: "Success", description: "Scheme information retrieved." });
        
        const speechResult = await speechPromise;
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

        {(loading || result) && (
          <div className="mt-6 p-4 bg-accent/20 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-headline font-semibold text-primary">Government Scheme Information:</h3>
                {audioResponseUri && !loading && (
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => audioRef.current?.play()}
                    >
                    <Play className="mr-2 h-4 w-4" />
                    Play Audio
                    </Button>
                )}
            </div>
             {loading && !result && <Skeleton className="h-20 w-full" />}
            {result && (
                <div className="text-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />').replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')}}></div>
            )}
             {audioResponseUri && (
                <audio ref={audioRef} src={audioResponseUri} className="hidden" />
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

    