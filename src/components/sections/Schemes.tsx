
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
    "Karnataka": ["Bengaluru Urban", "Mysuru", "Mangaluru", "Kalaburagi", "Mandya"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra"],
};

const GOVERNMENT_SCHEME_DOCS = [
    {
        title: "PM-Kisan Samman Nidhi (Income Support)",
        content: `Overview: A central-sector scheme launched on February 1, 2019, offers ₹6,000/year per small or marginal farmer family, disbursed as ₹2,000 every four months.
State-wise status for Karnataka: As of the 18th installment period (Aug–Nov 2024), 43.48 lakh farmers in Karnataka received payments under PM-KISAN. Nationally, over 9.59 crore farmers were covered in all states combined.
Steps for farmers to receive PM-Kisan: Ensure Aadhaar is linked to your bank account and your e-KYC is complete. Confirm your entry in the beneficiary list via the official PM-Kisan portal (pmkisan.gov.in). Once verified, ₹2,000 per installment will be DBT credited, three times a year.
Disbursement timeline: The 19th installment was disbursed on February 24, 2025, reaching over 9.8 crore farmers. The expected 20th installment is projected for June–July 2025.
Official Link: pmkisan.gov.in`
    },
    {
        title: "Pradhan Mantri Fasal Bima Yojana (PMFBY – Crop Insurance)",
        content: `Overview: Launched in February 2016, PMFBY provides comprehensive crop insurance covering pre-sowing risk, yield loss, post-harvest damage, and localized calamities like hailstorms or floods. It is administered at the state level in coordination with central MoA&FW and empanelled insurance companies.
State-wise deployment (case: Karnataka): In Kalaburagi District, Karnataka, over the past three years, 5,61,082 farmers insured their crops, receiving total compensation of ₹954.61 crore during the 2025 monsoon season alone. Farmers are urged to register by July 31, 2025 to qualify for compensation during Kharif cropping season.
Registration Steps for Farmers: Visit Gram-One centre, CSC, bank, or post office to enroll for PMFBY. Provide details of crops sown and area covered. Pay a subsidized premium based on crop and irrigation status (e.g. Rainfed Tur: ₹388.5/acre; irrigated Cotton: ₹1,492.3/acre). After harvest and loss event, farm-level loss assessment is carried out, and compensation is disbursed via DBT.
Scheme Continuation & Technology Push: The Union Cabinet has approved continuity of PMFBY and RWBCIS through 2025–26. State-of-the-art tech such as YES-TECH, drones, satellite imagery and remote sensing is now used in yield estimation and claims processing—Karnataka is among the 9 major participating states.
Official Link: pmfby.gov.in`
    },
    {
        title: "PM-KUSUM (Solar Irrigation & Renewable Energy)",
        content: `Overview: The Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan (PM-KUSUM) scheme offers subsidies up to ~60% for solar pumps, plus option to sell surplus power to the grid. It is available across states, including Karnataka. It encourages diesel reduction and clean energy adoption.
How to Navigate: Visit local agriculture/zilla offices or CSCs to enroll. Meet eligibility criteria (landholding size, crop type, etc.). Submit applications early for funding cycles.`
    },
    {
        title: "PM-FME (Micro Food Processing Enterprises)",
        content: `Overview: The Pradhan Mantri Formalisation of Micro food processing Enterprises (PM-FME) scheme is a Central-State co-funded support program. It offers up to ₹15 lakh per unit (₹6 lakh central, ₹9 lakh state) for agri-processing entrepreneurs. There has been strong uptake seen in Karnataka's Mandya district.
How to Navigate: Visit local agriculture/zilla offices or CSCs to enroll. Meet eligibility criteria and submit applications early for funding cycles.`
    },
    {
        title: "Other National Agriculture Schemes",
        content: `Agriculture Infrastructure Fund: Provides low-interest credit for agri-infrastructure projects.
National Horticulture Mission (NHM): Promotes horticulture sector development.
National Livestock Mission: Focuses on development of the livestock sector.
Formation of FPOs: Scheme to create and promote 10,000 Farmer Producer Organizations (FPOs).
ATMA (Agricultural Technology Management Agency): A scheme for strengthening extension services.
All these schemes are applied in Karnataka and other states as per central rollout.`
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
        
        const textForSpeech = cleanTextForSpeech(searchResult.schemeInformation);
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
