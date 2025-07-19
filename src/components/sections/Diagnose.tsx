
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
import { Loader2, Upload, History, Mic, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '../ui/textarea';
import { useLanguage } from '@/hooks/use-language';

interface Diagnosis {
  id: string;
  imageUrl?: string;
  diagnosis: string;
  timestamp: Timestamp;
}

export default function DiagnoseComponent() {
  const { user, isAuthReady } = useAuth();
  const { languageCode, languagePrompt } = useLanguage();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textQuery, setTextQuery] = useState('');
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);
  const [audioResponseUri, setAudioResponseUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState<Diagnosis[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);

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
      })) as Diagnosis[];
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
    if (audioResponseUri && audioRef.current) {
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [audioResponseUri]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({ title: "File too large", description: "Please upload an image smaller than 4MB.", variant: "destructive"});
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setDiagnosisResult(null);
        setAudioResponseUri(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDiagnose = async (query: string) => {
    if ((!imageFile && !query) || !user) {
      toast({ title: "Error", description: "Please upload an image or enter a query.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setDiagnosisResult(null);
    setAudioResponseUri(null);
    
    try {
      const input = {
          photoDataUri: imagePreview || undefined,
          textQuery: query || undefined,
          language: languagePrompt,
      }
      const result = await analyzePlantImage(input);
      const diagnosisText = result.diagnosis;
      setDiagnosisResult(diagnosisText);

      const db = getFirebaseDb();
      const appId = getFirebaseAppId();
      if (db) {
          await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/diagnoses`), {
              imageUrl: imagePreview || null,
              diagnosis: diagnosisText,
              timestamp: serverTimestamp(),
          });
      }
      toast({ title: "Success", description: "Plant analysis complete." });

      const speechResult = await textToSpeech({ text: diagnosisText });
      setAudioResponseUri(speechResult.audioDataUri);

    } catch(e) {
        const error = e as Error;
        console.error("Error diagnosing plant:", error);
        setDiagnosisResult(`Error: ${error.message}. Please try again.`);
        toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const handleTextSubmit = () => {
    handleDiagnose(textQuery);
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
      setTextQuery('');
      toast({ title: "Listening...", description: `Please speak your query in ${languagePrompt}.`});
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTextQuery(transcript);
      handleDiagnose(transcript);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Diagnose Crop Disease</CardTitle>
          <CardDescription>Upload a photo, then ask a question via text or voice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                {imagePreview ? (
                    <div className="relative w-full h-48">
                        <Image src={imagePreview} alt="Plant Preview" layout="fill" objectFit="contain" className="rounded-md" />
                    </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <Upload className="w-12 h-12" />
                    <p>Click to upload or drag and drop image</p>
                    <p className="text-xs">PNG, JPG, etc. up to 4MB</p>
                  </div>
                )}
            </div>

            <div className="flex items-center space-x-2">
              <Textarea 
                value={textQuery}
                onChange={(e) => setTextQuery(e.target.value)}
                placeholder="Describe the issue or ask a question..."
                className="min-h-[60px] flex-grow"
                disabled={loading}
              />
              <Button onClick={handleTextSubmit} disabled={(!imageFile && !textQuery) || loading || !user} size="icon" aria-label="Submit text query">
                {loading ? <Loader2 className="animate-spin" /> : <Send />}
              </Button>
              <Button 
                onClick={handleMicClick}
                disabled={loading || !user}
                size="icon"
                variant={isRecording ? 'destructive' : 'outline'}
                aria-label="Submit audio query"
              >
                {isRecording ? <Loader2 className="animate-pulse" /> : <Mic />}
              </Button>
            </div>
          
          {(loading || diagnosisResult || audioResponseUri) && (
            <div className="mt-6 p-4 bg-accent/20 border rounded-lg">
              <h3 className="text-lg font-headline font-semibold text-primary mb-2">Diagnosis Result:</h3>
              {loading && !diagnosisResult && <Skeleton className="h-20 w-full" />}
              {diagnosisResult && (
                <div className="text-sm text-foreground whitespace-pre-wrap">{diagnosisResult}</div>
              )}
               {audioResponseUri && (
                <div className="mt-4">
                    <audio ref={audioRef} src={audioResponseUri} controls className="w-full" />
                </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2"><History />Diagnosis History</CardTitle>
          <CardDescription>Your past diagnoses are saved here for tracking.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            {historyLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-muted-foreground text-center pt-10">No diagnosis history found. Log in to see history.</p>
            ) : (
              <div className="space-y-4">
                {history.map((entry) => (
                  <div key={entry.id} className="p-4 bg-card border rounded-lg shadow-sm flex gap-4 items-start">
                    {entry.imageUrl && (
                      <Image data-ai-hint="plant disease" src={entry.imageUrl} alt="Diagnosed plant" width={64} height={64} className="w-16 h-16 object-cover rounded-md" />
                    )}
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        {entry.timestamp ? new Date(entry.timestamp.toDate()).toLocaleString() : 'Loading date...'}
                      </p>
                      <p className="text-sm text-foreground/80 mt-1 line-clamp-2">
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
