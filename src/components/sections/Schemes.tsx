
'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSchemeInformation, type GetSchemeInformationOutput } from '@/ai/flows/get-scheme-information';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, Send, Play, StopCircle, MapPin, Search } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '../ui/skeleton';
import { useLanguage } from '@/hooks/use-language';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '../ui/scroll-area';

const DUMMY_STATES = ["Karnataka", "Maharashtra", "Tamil Nadu", "Uttar Pradesh"];
const DUMMY_DISTRICTS: Record<string, string[]> = {
    "Karnataka": ["Bengaluru Urban", "Mysuru", "Mangaluru"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra"],
};

const GOVERNMENT_SCHEME_DOCS = [
    {
        title: "Pradhan Mantri Krishi Sinchai Yojana (PMKSY) - Drip Irrigation",
        content: `The Pradhan Mantri Krishi Sinchai Yojana (PMKSY) aims to expand cultivated area under assured irrigation, improve on-farm water use efficiency to reduce wastage of water, enhance the adoption of precision irrigation (Drip and Sprinkler), recharge aquifers and introduce sustainable water conservation practices.
        Eligibility: All farmers are eligible. Priority is given to small and marginal farmers. Minimum age is 18.
        Application Link: https://pmksy.gov.in/`
    },
    {
        title: "Soil Health Card Scheme",
        content: `The Soil Health Card (SHC) scheme is promoted by the Department of Agriculture & Farmers Welfare, Ministry of Agriculture & Farmers Welfare. It aims at promoting Integrated Nutrient Management (INM) through judicious use of chemicals and organic fertilizers including bio-fertilizers and also soil test based balanced use of fertilizers.
        Eligibility: All farmers with agricultural land. No age limit.
        Application Link: https://soilhealth.dac.gov.in/`
    },
    {
        title: "Kisan Credit Card (KCC) Scheme",
        content: `The Kisan Credit Card (KCC) scheme provides adequate and timely credit support from the banking system to the farmers for their cultivation needs. This includes short term credit for crop production, post-harvest expenses, produce marketing loan, consumption requirements of farmer household, working capital for maintenance of farm assets and activities allied to agriculture, and investment credit for agriculture and allied activities.
        Eligibility: Farmers - individual/joint cultivators aged 18-75, tenant farmers, oral lessees & sharecroppers, SHGs/Joint Liability Groups of farmers.
        Application Link: https://www.sbi.co.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card`
    }
];

function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  let cleanedText = text.replace(/<[^>]*>?/gm, ' ');
  cleanedText = cleanedText.replace(/(https?:\/\/[^\s]+)/g, ' ');
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  return cleanedText;
}

export default function SchemesComponent() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [result, setResult] = useState<GetSchemeInformationOutput | null>(null);
  const [audioResponseUri, setAudioResponseUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { languageCode, languagePrompt, t } = useLanguage();
  const [age, setAge] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
        const userAge = localStorage.getItem(`user_age_${user.uid}`);
        if(userAge) setAge(userAge);
    }
    const simulatedState = "Karnataka";
    const simulatedDistrict = "Bengaluru Urban";
    setState(simulatedState);
    setDistrict(simulatedDistrict);
  }, [user]);

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

  const handleSearch = async (textQuery: string) => {
    if (!textQuery.trim()) {
      toast({ title: t('common.error'), description: t('schemes.errorDescription'), variant: "destructive" });
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
            state: state,
            district: district,
            age: age ? parseInt(age, 10) : undefined,
        };

        const searchPromise = getSchemeInformation(searchInput);
        
        const searchResult = await searchPromise;
        setResult(searchResult);
        
        const textForSpeech = cleanTextForSpeech(searchResult.schemeInformation + ' ' + (searchResult.otherRelevantSchemes || ''));
        const speechPromise = textToSpeech({ text: textForSpeech });
        
        toast({ title: t('common.success'), description: t('schemes.successDescription') });
        
        const speechResult = await speechPromise;
        setAudioResponseUri(speechResult.audioDataUri);

    } catch (error) {
      console.error("Error getting scheme info:", error);
      setResult({ schemeInformation: `Error: ${(error as Error).message}. Please try again.` });
      toast({ title: t('common.searchFailed'), description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const handleTextSubmit = () => {
    handleSearch(query);
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
      setQuery('');
      toast({ title: t('common.listening'), description: `${t('common.speakNow')} ${languagePrompt}.`});
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleSearch(transcript);
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
            <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary">{t('schemes.title')}</CardTitle>
                <CardDescription>{t('schemes.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="font-semibold flex items-center gap-2"><MapPin/> {t('admin.notify.byState')}</Label>
                        <Select value={state} onValueChange={(val) => { setState(val); setDistrict(''); }} disabled={loading}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('admin.notify.selectState')} />
                            </SelectTrigger>
                            <SelectContent>
                                {DUMMY_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="font-semibold flex items-center gap-2"><MapPin/> {t('admin.notify.byDistrict')}</Label>
                        <Select value={district} onValueChange={setDistrict} disabled={loading || !state}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('admin.notify.selectDistrict')} />
                            </SelectTrigger>
                            <SelectContent>
                                {(DUMMY_DISTRICTS[state] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('schemes.queryPlaceholder')}
                    className="min-h-[60px] pl-10 pr-20"
                    disabled={loading}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Button onClick={handleTextSubmit} disabled={!query || loading} size="icon" aria-label={t('schemes.textQueryAria')}>
                            {loading ? <Loader2 className="animate-spin" /> : <Send />}
                        </Button>
                        <Button 
                            onClick={handleMicClick}
                            disabled={loading}
                            size="icon"
                            variant={isRecording ? 'destructive' : 'outline'}
                            aria-label={t('schemes.audioQueryAria')}
                        >
                            {isRecording ? <Loader2 className="animate-pulse" /> : <Mic />}
                        </Button>
                    </div>
                </div>
            </CardContent>
            </Card>

            {(loading || result?.schemeInformation) && (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="font-headline text-xl text-primary">{t('schemes.resultTitle')}</CardTitle>
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
                </CardHeader>
                <CardContent>
                {loading && !result && <Skeleton className="h-40 w-full" />}
                {result?.schemeInformation && (
                    <div className="text-foreground whitespace-pre-wrap prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: result.schemeInformation.replace(/\n/g, '<br />').replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')}}></div>
                )}
                {audioResponseUri && (
                    <audio ref={audioRef} src={audioResponseUri} className="hidden" />
                )}
                </CardContent>
            </Card>
            )}
        </div>
        
        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl text-primary">{t('schemes.otherSchemesTitle')}</CardTitle>
                    <CardDescription>{t('schemes.otherSchemesDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                        {loading && !result && <Skeleton className="h-40 w-full" />}
                        {result?.otherRelevantSchemes ? (
                             <div className="text-foreground whitespace-pre-wrap prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: result.otherRelevantSchemes.replace(/\n/g, '<br />')}}></div>
                        ): (
                            <p className="text-muted-foreground text-center pt-10">{t('schemes.noOtherSchemes')}</p>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
