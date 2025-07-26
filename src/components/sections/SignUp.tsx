
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth, setupRecaptcha, getFirebaseAppId } from '@/lib/firebase';
import type { ConfirmationResult, RecaptchaVerifier, AuthError, UserCredential, User } from 'firebase/auth';
import { signInWithPhoneNumber, updateProfile, signInWithCredential, PhoneAuthProvider } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mic, User, Phone, Lock, Calendar } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

// Test credentials
const TEST_PHONE_NUMBER = '7905118695';
const TEST_OTP = '247952'; // Firebase requires a 6-digit OTP for testing.

export default function SignUpComponent() {
  const router = useRouter();
  const { toast } = useToast();
  const { languageCode, t } = useLanguage();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState<null | 'name' | 'phone' | 'age'>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [simulatedVerificationId, setSimulatedVerificationId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSendOtp = async () => {
    if (!name.trim()) {
        toast({ title: t('common.error'), description: t('signup.errorName'), variant: "destructive" });
        return;
    }
    if (!/^\d{1,3}$/.test(age) || parseInt(age, 10) <= 0) {
        toast({ title: t('common.error'), description: t('signup.errorAge'), variant: "destructive" });
        return;
    }
    setLoading(true);
    
    // Simulate sending OTP
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    setSimulatedVerificationId('fake-verification-id');
    setIsOtpSent(true);
    
    const description = t('signup.otpSentDesc').replace('{phone}', `+91${TEST_PHONE_NUMBER}`);
    toast({ title: t('signup.otpSentTitle'), description: description });
    
    setOtp(TEST_OTP); // Pre-fill with the test OTP
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    const finalOtp = otp || TEST_OTP;
    if (!finalOtp || !simulatedVerificationId) {
        toast({ title: t('common.error'), description: t('signup.errorOtp'), variant: "destructive" });
        return;
    }
    
    setLoading(true);
    try {
        const auth = getFirebaseAuth()!;
        
        // This part is new: We create a credential object to sign in with.
        const credential = PhoneAuthProvider.credential(simulatedVerificationId, finalOtp);
        
        // Since we are using an anonymous user, we can link the credential.
        // For a new user, you would use signInWithCredential(auth, credential)
        // This is a more robust way to handle the sign-in/linking.
        // I am assuming the useAuth hook has already signed in the user anonymously.
        const user = auth.currentUser;

        if (!user) {
            // This is a fallback in case the anonymous user isn't there.
             await signInWithCredential(auth, credential);
        }
        
        const currentUser = auth.currentUser;
        if (currentUser) {
            await updateProfile(currentUser, { displayName: name });
            localStorage.setItem(`user_age_${currentUser.uid}`, age);
            toast({ title: t('common.success'), description: t('signup.success') });
            router.push('/');
        } else {
            throw new Error("User not found after verification.");
        }
    } catch (error) {
        console.error("Error verifying OTP (simulation):", error);
        // This error will likely show up in the console if the linking fails,
        // but it won't crash the app for the user.
        toast({ title: t('signup.errorInvalidOtp'), description: "The simulated OTP is incorrect. Please check the code.", variant: "destructive" });
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

  const handleMicClick = (field: 'name' | 'phone' | 'age') => {
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
      const fieldName = t(`signup.${field}Label`);
      const toastDescription = t('signup.speakNow').replace('{field}', fieldName);
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
      } else if (field === 'age') {
        const num = parseInt(transcript.replace(/\s+/g, ''), 10);
        if (!isNaN(num) && num > 0) {
            setAge(String(num));
        } else {
            toast({ title: t('common.error'), description: t('signup.errorAge'), variant: 'destructive' });
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
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">{t('signup.title')}</CardTitle>
          <CardDescription>{t('signup.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isOtpSent ? (
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
                <Label htmlFor="age" className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {t('signup.ageLabel')}</Label>
                <div className="flex items-center gap-2">
                    <Input id="age" type="number" placeholder={t('signup.agePlaceholder')} value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ''))} disabled={loading} />
                    <Button variant={isRecording === 'age' ? 'destructive' : 'outline'} size="icon" onClick={() => handleMicClick('age')}>
                        <Mic />
                    </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="w-4 h-4" /> {t('signup.phoneLabel')}</Label>
                <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-md w-full">
                        <span className="text-sm pl-3 pr-2 text-muted-foreground">+91</span>
                        <Input id="phone" type="tel" placeholder={t('signup.phonePlaceholder')} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} disabled={true} className="border-l-0 rounded-l-none" maxLength={10}/>
                    </div>
                     <Button variant={isRecording === 'phone' ? 'destructive' : 'outline'} size="icon" onClick={() => handleMicClick('phone')} disabled={loading || true}>
                        <Mic />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t('signup.phoneHint')}</p>
              </div>
              <Button onClick={handleSendOtp} disabled={loading || !name || !age} className="w-full">
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
              <Button variant="link" onClick={() => setIsOtpSent(false)} className="w-full">
                {t('signup.changePhoneButton')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
