
'use client';

import { useState, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { getFirebaseDb, getFirebaseAppId } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, type Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { analyzePlantImage } from '@/ai/flows/analyze-plant-image';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Loader2, Upload, History, Mic, Send, Play, StopCircle, RefreshCcw, User as UserIcon, Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '../ui/textarea';
import { useLanguage } from '@/hooks/use-language';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';


interface DiagnosisHistory {
  id: string;
  imageUrl?: string;
  diagnosis: string;
  timestamp: Timestamp;
}

interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

export default function DiagnoseComponent() {
  const { user, isAuthReady } = useAuth();
  const { languageCode, languagePrompt, t } = useLanguage();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textQuery, setTextQuery] = useState('');
  
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  
  const [audioResponseUri, setAudioResponseUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState<DiagnosisHistory[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthReady) return;

    const db = getFirebaseDb();
    const appId = getFirebaseAppId();

    if (!user || !db) {
      setHistoryLoading(false);
      return;
    };

    const userDiagnosisCollectionRef = collection(db, `artifacts/${appId}/users/${user.uid}/diagnoses`);
    const q = query(userDiagnosisCollectionRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as DiagnosisHistory[];
      setHistory(historyData);
      setHistoryLoading(false);
    }, (error: any) => {
      console.error("Error fetching diagnosis history:", error);
      let description = "Could not fetch diagnosis history.";
      
      if (error.code === 'failed-precondition') {
        const urlMatch = error.message.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          const url = urlMatch[0];
          description = `Your database needs a new index to show history. <a href="${url}" target="_blank" rel="noopener noreferrer" class="font-bold text-blue-400 underline">Please click here to create it</a>, then refresh the page.`;
           toast({ 
            title: "Database Index Required", 
            description: <div dangerouslySetInnerHTML={{ __html: description }} />,
            variant: "destructive",
            duration: 30000 
          });
        } else {
           toast({ title: "Database Error", description: "An index is required. Please check the Firestore console.", variant: "destructive" });
        }
      } else {
         toast({ title: "Error Fetching History", description: description, variant: "destructive" });
      }
      setHistoryLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAuthReady, toast]);

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

   useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, loading]);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({ title: t('diagnose.fileTooLargeTitle'), description: t('diagnose.fileTooLargeDesc'), variant: "destructive"});
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setConversation([]);
        setAudioResponseUri(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDiagnose = async (query: string) => {
    if ((!imageFile && !query) || !user) {
      toast({ title: t('common.error'), description: t('diagnose.errorDescription'), variant: "destructive" });
      return;
    }

    setLoading(true);
    setAudioResponseUri(null);
    setConversation(prev => [...prev, { role: 'user', content: query }]);
    
    try {
      // For multi-turn, we can include previous conversation context if the AI flow supports it.
      // For now, each call is independent but part of the same UI conversation.
      const input = {
          photoDataUri: imagePreview || undefined,
          textQuery: query,
          language: languagePrompt,
      }
      
      const analysisPromise = analyzePlantImage(input);
      
      const [analysisResult] = await Promise.all([analysisPromise]);
      const diagnosisText = analysisResult.diagnosis;
      setConversation(prev => [...prev, { role: 'assistant', content: diagnosisText }]);

      const speechPromise = textToSpeech({ text: diagnosisText });

      // Only save initial diagnosis to history
      if (conversation.length <= 1) {
        const db = getFirebaseDb();
        const appId = getFirebaseAppId();
        if (db) {
            addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/diagnoses`), {
                imageUrl: imagePreview || null,
                diagnosis: diagnosisText,
                timestamp: serverTimestamp(),
            }).catch(console.error);
        }
      }

      toast({ title: t('common.success'), description: t('diagnose.successDescription') });
      
      const speechResult = await speechPromise;
      setAudioResponseUri(speechResult.audioDataUri);

    } catch(e) {
        const error = e as Error;
        console.error("Error diagnosing plant:", error);
        const errorMessage = `Error: ${error.message}. Please try again.`;
        setConversation(prev => [...prev, { role: 'assistant', content: errorMessage }]);
        toast({ title: t('common.analysisFailed'), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setTextQuery('');
    }
  };
  
  const handleTextSubmit = () => {
    handleDiagnose(textQuery);
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
      setTextQuery('');
      toast({ title: t('common.listening'), description: `${t('common.speakNow')} ${languagePrompt}.`});
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTextQuery(transcript);
      handleDiagnose(transcript);
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

  const handleStartNewDiagnosis = () => {
    setImageFile(null);
    setImagePreview(null);
    setTextQuery('');
    setConversation([]);
    setAudioResponseUri(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }
  
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </CardContent>
        </Card>
    </div>
  );

  if (!isAuthReady) {
    return renderSkeletons();
  }

  const hasStartedConversation = imagePreview || conversation.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">{t('diagnose.title')}</CardTitle>
            <CardDescription>{t('diagnose.description')}</CardDescription>
          </CardHeader>
          {!hasStartedConversation && (
            <CardContent>
                <div
                    className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 text-center cursor-pointer hover:bg-accent/20 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      ref={fileInputRef}
                      className="hidden"
                    />
                      <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                        <Upload className="w-12 h-12" />
                        <p>{t('diagnose.uploadPrompt')}</p>
                        <p className="text-xs">{t('diagnose.uploadConstraints')}</p>
                      </div>
                </div>
            </CardContent>
          )}

          {hasStartedConversation && (
             <CardContent className="space-y-4">
                <ScrollArea className="h-[400px] w-full p-4 border rounded-lg">
                    {imagePreview && (
                        <div className="relative w-full h-48 mb-4">
                            <Image src={imagePreview} alt={t('diagnose.plantPreviewAlt')} layout="fill" objectFit="contain" className="rounded-md" />
                        </div>
                    )}
                    {conversation.map((msg, index) => (
                        <div key={index} className={cn("flex items-start gap-3 my-4", msg.role === 'user' ? "justify-end" : "justify-start")}>
                           {msg.role === 'assistant' && (
                               <Avatar className="h-8 w-8">
                                   <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
                               </Avatar>
                           )}
                           <div className={cn("p-3 rounded-lg max-w-sm whitespace-pre-wrap", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                               {msg.content}
                           </div>
                           {msg.role === 'user' && (
                                <Avatar className="h-8 w-8">
                                   <AvatarFallback><UserIcon /></AvatarFallback>
                               </Avatar>
                           )}
                        </div>
                    ))}
                     {loading && (
                        <div className="flex items-start gap-3 my-4 justify-start">
                           <Avatar className="h-8 w-8">
                               <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
                           </Avatar>
                           <div className="p-3 rounded-lg bg-muted">
                               <Loader2 className="animate-spin" />
                           </div>
                        </div>
                     )}
                    <div ref={conversationEndRef} />
                </ScrollArea>
                {audioResponseUri && !loading && conversation.some(m => m.role === 'assistant') && (
                  <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={handlePlayPause}>
                          {isPlaying ? <StopCircle className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                          {isPlaying ? t('common.stopAudio') : t('common.playAudio')}
                      </Button>
                      {audioResponseUri && <audio ref={audioRef} src={audioResponseUri} className="hidden" />}
                  </div>
                )}


                <div className="flex items-center space-x-2 pt-4">
                  <Textarea 
                    value={textQuery}
                    onChange={(e) => setTextQuery(e.target.value)}
                    placeholder={conversation.length > 0 ? t('diagnose.followUpPlaceholder') : t('diagnose.queryPlaceholder')}
                    className="min-h-[60px] flex-grow"
                    disabled={loading || !imagePreview}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleTextSubmit();
                      }
                    }}
                  />
                  <Button onClick={handleTextSubmit} disabled={!textQuery || loading || !user} size="icon" aria-label={t('diagnose.textQueryAria')}>
                    {loading ? <Loader2 className="animate-spin" /> : <Send />}
                  </Button>
                  <Button 
                    onClick={handleMicClick}
                    disabled={loading || !user || !imagePreview}
                    size="icon"
                    variant={isRecording ? 'destructive' : 'outline'}
                    aria-label={t('diagnose.audioQueryAria')}
                  >
                    {isRecording ? <Loader2 className="animate-pulse" /> : <Mic />}
                  </Button>
                </div>
                 <div className="flex justify-center pt-4">
                     <Button variant="outline" onClick={handleStartNewDiagnosis}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        {t('diagnose.newChat')}
                    </Button>
                </div>
             </CardContent>
          )}

        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2"><History />{t('diagnose.historyTitle')}</CardTitle>
          <CardDescription>{t('diagnose.historyDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            {historyLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-muted-foreground text-center pt-10">{t('diagnose.noHistory')}</p>
            ) : (
              <div className="space-y-4">
                {history.map((entry) => (
                  <div key={entry.id} className="p-4 bg-card border rounded-lg shadow-sm flex gap-4 items-start">
                    {entry.imageUrl && (
                      <Image data-ai-hint="plant disease" src={entry.imageUrl} alt={t('diagnose.diagnosedPlantAlt')} width={64} height={64} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium">
                        {entry.timestamp ? new Date(entry.timestamp.toDate()).toLocaleString() : t('common.loadingDate')}
                      </p>
                      <p className="text-sm text-foreground/90 mt-1 line-clamp-3">
                        {entry.diagnosis}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

    