
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth, setupRecaptcha } from '@/lib/firebase';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { signInWithPhoneNumber, updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mic, User, Phone, Lock } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

export default function SignUpComponent() {
  const router = useRouter();
  const { toast } = useToast();
  const { languageCode, languagePrompt, t } = useLanguage();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState<null | 'name' | 'phone'>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (auth && !recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = setupRecaptcha('recaptcha-container', {
            'size': 'invisible',
            'callback': () => {
                // reCAPTCHA solved, allow send OTP
            }
        });
    }
  }, []);

  const handleSendOtp = async () => {
    if (!phone || !recaptchaVerifierRef.current) {
        toast({ title: "Error", description: "Please enter a valid phone number.", variant: "destructive" });
        return;
    }
    setLoading(true);
    try {
        const auth = getFirebaseAuth()!;
        const result = await signInWithPhoneNumber(auth, `+${phone}`, recaptchaVerifierRef.current);
        setConfirmationResult(result);
        toast({ title: "OTP Sent", description: `An OTP has been sent to +${phone}.` });
    } catch (error) {
        console.error("Error sending OTP:", error);
        toast({ title: "Failed to Send OTP", description: (error as Error).message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !confirmationResult) {
        toast({ title: "Error", description: "Please enter the OTP.", variant: "destructive" });
        return;
    }
    if (!name.trim()) {
        toast({ title: "Error", description: "Please enter your name.", variant: "destructive" });
        return;
    }
    setLoading(true);
    try {
        const result = await confirmationResult.confirm(otp);
        const user = result.user;
        await updateProfile(user, { displayName: name });
        toast({ title: "Success!", description: "You have been successfully signed up." });
        router.push('/');
    } catch (error) {
        console.error("Error verifying OTP:", error);
        toast({ title: "Invalid OTP", description: "The OTP you entered is incorrect. Please try again.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const handleMicClick = (field: 'name' | 'phone') => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(null);
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
      setIsRecording(field);
      toast({ title: t('common.listening'), description: `Please speak your ${field}.`});
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (field === 'name') {
        setName(transcript);
      } else if (field === 'phone') {
        // Remove non-numeric characters for phone number
        setPhone(transcript.replace(/\D/g, ''));
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
  }

  return (
    <>
      <div id="recaptcha-container" />
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Create an Account</CardTitle>
          <CardDescription>Sign up using your mobile number to get started.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!confirmationResult ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2"><User className="w-4 h-4" /> Your Name</Label>
                <div className="flex items-center gap-2">
                    <Input id="name" type="text" placeholder="Siddhartha Mishra" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
                    <Button variant={isRecording === 'name' ? 'destructive' : 'outline'} size="icon" onClick={() => handleMicClick('name')}>
                        <Mic />
                    </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="w-4 h-4" /> Mobile Number</Label>
                <div className="flex items-center gap-2">
                    <Input id="phone" type="tel" placeholder="91xxxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading} />
                     <Button variant={isRecording === 'phone' ? 'destructive' : 'outline'} size="icon" onClick={() => handleMicClick('phone')}>
                        <Mic />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">Include country code (e.g., 91 for India).</p>
              </div>
              <Button onClick={handleSendOtp} disabled={loading || !phone || !name} className="w-full">
                {loading ? <Loader2 className="animate-spin" /> : "Send OTP"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp" className="flex items-center gap-2"><Lock className="w-4 h-4" /> Verification Code</Label>
                <Input id="otp" type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} disabled={loading} maxLength={6} />
              </div>
              <Button onClick={handleVerifyOtp} disabled={loading || !otp} className="w-full">
                {loading ? <Loader2 className="animate-spin" /> : "Verify & Sign Up"}
              </Button>
              <Button variant="link" onClick={() => setConfirmationResult(null)} className="w-full">
                Change phone number
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
