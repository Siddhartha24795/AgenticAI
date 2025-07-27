
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send, BellPlus, Users, Map, MapPin } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DUMMY_STATES = ["Karnataka", "Maharashtra", "Tamil Nadu", "Uttar Pradesh"];
const DUMMY_DISTRICTS: Record<string, string[]> = {
    "Karnataka": ["Bengaluru Urban", "Mysuru", "Mangaluru"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra"],
};


export default function AdminNotifyComponent() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [audience, setAudience] = useState('all');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [message, setMessage] = useState('');

  const handleSendNotification = () => {
    if (!audience) {
      toast({ title: t('common.error'), description: t('admin.notify.selectAudience'), variant: 'destructive' });
      return;
    }
    if (!message.trim()) {
      toast({ title: t('common.error'), description: t('admin.notify.enterMessage'), variant: 'destructive' });
      return;
    }

    console.log('Sending Notification (Simulated):', {
      audience,
      state: audience === 'state' || audience === 'district' ? state : undefined,
      district: audience === 'district' ? district : undefined,
      message,
    });

    toast({
      title: t('admin.notify.notificationSentTitle'),
      description: t('admin.notify.notificationSentDesc'),
    });

    // Reset form
    setMessage('');
    setAudience('all');
    setState('');
    setDistrict('');
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2">
          <BellPlus />
          {t('admin.notify.title')}
        </CardTitle>
        <CardDescription>{t('admin.notify.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="font-semibold flex items-center gap-2"><Users /> {t('admin.notify.targetAudience')}</Label>
          <RadioGroup value={audience} onValueChange={setAudience} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all">{t('admin.notify.allUsers')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="state" id="state" />
              <Label htmlFor="state">{t('admin.notify.byState')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="district" id="district" />
              <Label htmlFor="district">{t('admin.notify.byDistrict')}</Label>
            </div>
          </RadioGroup>
        </div>

        {(audience === 'state' || audience === 'district') && (
            <div className="space-y-2">
                <Label className="font-semibold flex items-center gap-2"><Map/> {t('admin.notify.byState')}</Label>
                <Select value={state} onValueChange={(val) => { setState(val); setDistrict(''); }}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('admin.notify.selectState')} />
                    </SelectTrigger>
                    <SelectContent>
                        {DUMMY_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        )}

        {audience === 'district' && state && (
             <div className="space-y-2">
                <Label className="font-semibold flex items-center gap-2"><MapPin/> {t('admin.notify.byDistrict')}</Label>
                <Select value={district} onValueChange={setDistrict}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('admin.notify.selectDistrict')} />
                    </SelectTrigger>
                    <SelectContent>
                        {DUMMY_DISTRICTS[state]?.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="message" className="font-semibold">{t('admin.notify.message')}</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('admin.notify.messagePlaceholder')}
            className="min-h-[120px]"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSendNotification} className="w-full">
          <Send className="mr-2 h-4 w-4" />
          {t('admin.notify.sendNotification')}
        </Button>
      </CardFooter>
    </Card>
  );
}

    