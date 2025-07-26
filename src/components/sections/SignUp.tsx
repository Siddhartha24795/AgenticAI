
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

const TEST_PHONE_NUMBER = '9999999999';
const TEST_OTP = '123456';

export default function SignUpComponent() {
  const router = useRouter();
  const { toast } = useToast();
  const { languageCode, t } = useLanguage();
  
  const [name, setName] = useState('Siddhartha Mishra');
  const [phone, setPhone] = useState(TEST_PHONE_NUMBER);
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

    setLoading(true);
    
    // Simulate sending OTP for test number
    try {
        const auth = getFirebaseAuth()!;
        const verifier = (window as any).recaptchaVerifierInstance as RecaptchaVerifier;
        const testConfirmationResult = {
            verificationId: "test-verification-id",
            confirm: async (verificationCode: string) => {
                if (verificationCode === TEST_OTP) {
                    // In a real scenario, you'd get a user object from Firebase.
                    // Here we'll simulate it. This part requires a real user object
                    // to update the profile, so we'll still call firebase but with test credentials.
                    // This is a mock structure.
                     if (auth.currentUser) {
                        return { user: auth.currentUser };
                    }
                    // This will likely fail if not truly authenticated but lets us test the UI flow
                    throw new Error("Test mode can't create real users. This is for UI flow testing.");
                } else {
                    throw new Error("Invalid test OTP");
                }
            }
        };

        // For UI testing purposes, we create a mock confirmation result.
        const mockConfirmation: ConfirmationResult = {
            verificationId: 'mock-verification-id',
            confirm: async (verificationCode: string) => {
                if (verificationCode === TEST_OTP) {
                    // This part is tricky because we need a real user object to update the profile.
                    // The best we can do is simulate success and proceed.
                    // Let's assume signInAnonymously has already provided a user.
                    if (auth.currentUser) {
                        return { user: auth.currentUser };
                    }
                    throw new Error("auth/user-not-found");
                }
                const error: AuthError = {
                    code: 'auth/invalid-verification-code',
                    message: 'The verification code is invalid.',
                    name: 'FirebaseError'
                };
                throw error;
            },
        };

        setConfirmationResult(mockConfirmation);
        const phoneNumber = `+91${phone}`;
        const description = t('signup.otpSentDesc').replace('{phone}', phoneNumber);
        toast({ title: t('signup.otpSentTitle'), description });

    } catch (e) {
        const error = e as AuthError;
        console.error("Error preparing test mode:", error);
        toast({ title: "Test Mode Error", description: error.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !confirmationResult) {
        toast({ title: t('common.error'), description: t('signup.errorOtp'), variant: "destructive" });
        return;
    }
    if (otp !== TEST_OTP) {
        toast({ title: t('signup.errorInvalidOtp'), description: t('signup.errorInvalidOtpDesc'), variant: "destructive" });
        return;
    }
    if (!name.trim()) {
        toast({ title: t('common.error'), description: t('signup.errorName'), variant: "destructive" });
        return;
    }
    setLoading(true);
    try {
        const auth = getFirebaseAuth()!;
        if (!auth.currentUser) {
            throw new Error("No anonymous user found to upgrade.");
        }
        await updateProfile(auth.currentUser, { displayName: name });
        toast({ title: t('common.success'), description: t('signup.success') });
        router.push('/');
    } catch (error) {
        console.error("Error verifying OTP in test mode:", error);
        toast({ title: t('signup.errorInvalidOtp'), description: (error as Error).message, variant: "destructive" });
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
    // Disabled for test mode
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
                        <Input id="phone" type="tel" placeholder={t('signup.phonePlaceholder')} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} disabled={true} className="border-l-0 rounded-l-none bg-muted/50" maxLength={10}/>
                    </div>
                     <Button variant={isRecording === 'phone' ? 'destructive' : 'outline'} size="icon" onClick={() => handleMicClick('phone')} disabled={true}>
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
              <p className="text-xs text-center text-destructive font-semibold">Test Mode: Use OTP 123456</p>
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
