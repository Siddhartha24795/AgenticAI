
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth, setupRecaptcha } from '@/lib/firebase';
import type { ConfirmationResult, RecaptchaVerifier, AuthError } from 'firebase/auth';
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
  const { languageCode, t } = useLanguage();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState<null | 'name' | 'phone'>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    const auth = getFirebaseAuth();
    if (auth && !recaptchaVerifierRef.current) {
        const recaptchaContainer = document.getElementById('recaptcha-container');
        if (recaptchaContainer) {
            recaptchaVerifierRef.current = setupRecaptcha('recaptcha-container', {
                'size': 'invisible',
                'callback': () => {},
            });
        }
    }
  }, []);

  const handleSendOtp = async () => {
    if (!name.trim()) {
        toast({ title: "Error", description: "Please enter your name.", variant: "destructive" });
        return;
    }
    if (!/^\d{10}$/.test(phone)) {
        toast({ title: "Error", description: "Please enter a valid 10-digit phone number.", variant: "destructive" });
        return;
    }
    const verifier = recaptchaVerifierRef.current;
    if (!verifier) {
        toast({ title: "Error", description: "reCAPTCHA not initialized. Please refresh the page.", variant: "destructive" });
        return;
    }

    setLoading(true);
    try {
        const auth = getFirebaseAuth()!;
        const phoneNumber = `+91${phone}`;
        const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
        setConfirmationResult(result);
        toast({ title: "OTP Sent", description: `An OTP has been sent to ${phoneNumber}.` });
    } catch (e) {
        const error = e as AuthError;
        console.error("Error sending OTP:", error);
        let description = "An unknown error occurred while sending the OTP.";
        if (error.code === 'auth/operation-not-allowed') {
            description = "Phone number sign-in is not enabled for this Firebase project. Please enable it in the Firebase console under Authentication > Sign-in method.";
        } else if (error.code === 'auth/invalid-phone-number') {
            description = "The phone number is not valid. Please enter a 10-digit number.";
        } else if (error.code === 'auth/billing-not-enabled') {
            description = "The Firebase project's free quota for phone authentication has been exceeded. Please enable billing for this project in the Google Cloud Console to continue.";
        } else {
            description = error.message;
        }
        toast({ title: "Failed to Send OTP", description, variant: "destructive", duration: 10000 });
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

  const stopRecognition = () => {
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
    if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
    }
    setIsRecording(null);
  };

  const handleMicClick = (field: 'name' | 'phone') => {
    if (isRecording) {
      stopRecognition();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: t('common.error'), description: t('common.speechRecognitionNotSupported'), variant: "destructive" });
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = languageCode;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.continuous = true;

    recognitionRef.current.onstart = () => {
      setIsRecording(field);
      toast({ title: t('common.listening'), description: `Please speak your ${field}.`});
    };

    recognitionRef.current.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      if (field === 'name') {
        setName(transcript);
      } else if (field === 'phone') {
        const numericTranscript = transcript.replace(/\D/g, '');
        setPhone(numericTranscript);

        if (numericTranscript.length >= 10) {
            setPhone(numericTranscript.substring(0, 10));
            stopRecognition();
            toast({ title: "Success", description: "10-digit number captured."});
        }
      }
      
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = setTimeout(() => {
        if(isRecording) stopRecognition();
      }, 3000);
    };
    
    recognitionRef.current.onerror = (event: any) => {
       if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error("Speech recognition error", event.error);
        toast({ title: t('common.speechError'), description: `${t('common.errorOccurred')} ${event.error}`, variant: "destructive" });
      }
    };

    recognitionRef.current.onend = () => {
      if (field === 'name' && name) {
        setName(prev => prev.replace(/[.,!?]$/, '').trim());
      }
      stopRecognition();
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
                    <div className="flex items-center border rounded-md w-full">
                        <span className="text-sm pl-3 pr-2 text-muted-foreground">+91</span>
                        <Input id="phone" type="tel" placeholder="xxxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} disabled={loading} className="border-l-0 rounded-l-none" maxLength={10}/>
                    </div>
                     <Button variant={isRecording === 'phone' ? 'destructive' : 'outline'} size="icon" onClick={() => handleMicClick('phone')}>
                        <Mic />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">Enter your 10-digit mobile number.</p>
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
