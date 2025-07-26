
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

  const recognitionRef = useRef<any>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    const auth = getFirebaseAuth();
    if (auth && !(window as any).recaptchaVerifierInstance) {
        const recaptchaContainer = document.getElementById('recaptcha-container');
        if (recaptchaContainer) {
            setupRecaptcha('recaptcha-container', {
                'size': 'invisible',
                'callback': () => {},
            });
        }
    }
  }, []);

  const handleSendOtp = async () => {
    if (!name.trim()) {
        toast({ title: t('common.error'), description: t('signup.errorName'), variant: "destructive" });
        return;
    }
    if (!/^\d{10}$/.test(phone)) {
        toast({ title: t('common.error'), description: t('signup.errorPhone'), variant: "destructive" });
        return;
    }
    const verifier = (window as any).recaptchaVerifierInstance as RecaptchaVerifier | undefined;
    if (!verifier) {
        toast({ title: t('common.error'), description: t('signup.errorRecaptcha'), variant: "destructive" });
        return;
    }

    setLoading(true);
    
    try {
        const auth = getFirebaseAuth()!;
        const phoneNumber = `+91${phone}`;
        const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
        setConfirmationResult(result);
        const description = t('signup.otpSentDesc').replace('{phone}', phoneNumber);
        toast({ title: t('signup.otpSentTitle'), description: description });
    } catch (e) {
        const error = e as AuthError;
        console.error("Error sending OTP:", error);
        let description = t('signup.errorOtpGeneric');

        if (error.code === 'auth/operation-not-allowed') {
            description = t('signup.errorOtpOperationNotAllowed');
        } else if (error.code === 'auth/missing-billable-project-error') {
            description = t('signup.errorBillingNotEnabled');
        } else if (error.code === 'auth/captcha-check-failed') {
            description = t('signup.errorCaptchaCheckFailed');
        } else if (error.message) {
            description = error.message;
        }

        toast({ title: t('signup.errorOtpFailed'), description: description, variant: "destructive", duration: 10000 });
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
        toast({ title: t('common.error'), description: t('signup.errorOtp'), variant: "destructive" });
        return;
    }
    if (!confirmationResult) {
        toast({ title: t('signup.errorOtpFailed'), description: "Confirmation result not found.", variant: "destructive" });
        return;
    }
    
    setLoading(true);
    try {
        await confirmationResult.confirm(otp);
        // After confirmation, the user is signed in. Now update their profile.
        const auth = getFirebaseAuth()!;
        const currentUser = auth.currentUser;
        if (currentUser) {
            await updateProfile(currentUser, { displayName: name });
            toast({ title: t('common.success'), description: t('signup.success') });
            router.push('/');
        } else {
            throw new Error("User not found after OTP verification.");
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        toast({ title: t('signup.errorInvalidOtp'), description: t('signup.errorInvalidOtpDesc'), variant: "destructive" });
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
      const toastDescription = t('signup.speakNow').replace('{field}', field === 'name' ? t('signup.nameLabel') : t('signup.phoneLabel'));
      toast({ title: t('common.listening'), description: toastDescription});
    };

    recognitionRef.current.onresult = (event: any) => {
      let transcript = event.results[0][0].transcript;
      if (field === 'phone') {
        transcript = transcript.replace(/\s+/g, '');
        if (/^\d{10}$/.test(transcript)) {
            setPhone(transcript);
            const phoneCapturedMessage = t('signup.phoneCaptured');
            toast({ title: t('common.success'), description: phoneCapturedMessage });
            stopRecognition();
        } else {
            toast({ title: t('common.error'), description: t('signup.errorPhone'), variant: 'destructive' });
        }
      } else {
        setName(transcript);
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
    speechTimeoutRef.current = setTimeout(stopRecognition, 5000);
  }

  return (
    <>
      <div id="recaptcha-container" />
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">{t('signup.title')}</CardTitle>
          <CardDescription>{t('signup.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!confirmationResult ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2"><User className="w-4 h-4" /> {t('signup.nameLabel')}</Label>
                <div className="flex items-center gap-2">
                    <Input id="name" type="text" placeholder={t('signup.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
                    <Button variant={isRecording === 'name' ? 'destructive' : 'outline'} size="icon" onClick={() => handleMicClick('name')}>
                        <Mic />
                    </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="w-4 h-4" /> {t('signup.phoneLabel')}</Label>
                <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-md w-full">
                        <span className="text-sm pl-3 pr-2 text-muted-foreground">+91</span>
                        <Input id="phone" type="tel" placeholder={t('signup.phonePlaceholder')} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} disabled={loading} className="border-l-0 rounded-l-none" maxLength={10}/>
                    </div>
                     <Button variant={isRecording === 'phone' ? 'destructive' : 'outline'} size="icon" onClick={() => handleMicClick('phone')} disabled={loading}>
                        <Mic />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t('signup.phoneHint')}</p>
              </div>
              <Button onClick={handleSendOtp} disabled={loading || !phone || !name} className="w-full">
                {loading ? <Loader2 className="animate-spin" /> : t('signup.sendOtpButton')}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp" className="flex items-center gap-2"><Lock className="w-4 h-4" /> {t('signup.otpLabel')}</Label>

                <Input id="otp" type="text" placeholder={t('signup.otpPlaceholder')} value={otp} onChange={(e) => setOtp(e.target.value)} disabled={loading} maxLength={6} />
              </div>
              <Button onClick={handleVerifyOtp} disabled={loading || !otp} className="w-full">
                {loading ? <Loader2 className="animate-spin" /> : t('signup.verifyButton')}
              </Button>
              <Button variant="link" onClick={() => setConfirmationResult(null)} className="w-full">
                {t('signup.changePhoneButton')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
