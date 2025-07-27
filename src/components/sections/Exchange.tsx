
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/hooks/use-language';
import { ArrowRightLeft, Package, Phone, Search, ShoppingCart, Tractor } from 'lucide-react';

const dummySellOffers = [
  {
    id: 1,
    item: 'Organic Urea Fertilizer',
    quantity: '5 bags (50kg each)',
    farmer: 'Ramesh Kumar',
    location: 'Mandya, Karnataka',
    contact: '+91-9876543210',
    type: 'fertilizer' as const,
  },
  {
    id: 2,
    item: 'Sona Masuri Paddy Seeds',
    quantity: '200 kg',
    farmer: 'Savitri Bai',
    location: 'Raichur, Karnataka',
    contact: '+91-9876543211',
    type: 'seed' as const,
  },
  {
    id: 3,
    item: 'Used Power Tiller',
    quantity: '1 unit',
    farmer: 'Gopal Reddy',
    location: 'Kalaburagi, Karnataka',
    contact: '+91-9876543212',
    type: 'equipment' as const,
  },
   {
    id: 4,
    item: 'Organic Compost',
    quantity: '1 Tonne',
    farmer: 'Lakshmi Devi',
    location: 'Mysuru, Karnataka',
    contact: '+91-9876543213',
    type: 'fertilizer' as const,
  },
];

const dummyBuyRequests = [
  {
    id: 1,
    item: 'DAP Fertilizer',
    quantity: '2 bags',
    farmer: 'Anand Sharma',
    location: 'Bengaluru Rural, Karnataka',
    contact: '+91-8765432109',
    type: 'fertilizer' as const,
  },
  {
    id: 2,
    item: 'Groundnut Seeds (G2-G3)',
    quantity: '50 kg',
    farmer: 'Priya Patel',
    location: 'Chitradurga, Karnataka',
    contact: '+91-8765432108',
    type: 'seed' as const,
  },
  {
    id: 3,
    item: 'Rental for Sprayer Pump',
    quantity: '2 days',
    farmer: 'Muthu Krishnan',
    location: 'Kolar, Karnataka',
    contact: '+91-8765432107',
    type: 'equipment' as const,
  },
   {
    id: 4,
    item: 'Ragi Seeds',
    quantity: '10 kg',
    farmer: 'Suresh Gowda',
    location: 'Tumakuru, Karnataka',
    contact: '+91-8765432106',
    type: 'seed' as const,
  },
];

const getIcon = (type: 'seed' | 'fertilizer' | 'equipment') => {
    switch (type) {
        case 'seed':
            return <Package className="h-6 w-6 text-green-600" />;
        case 'fertilizer':
            return <ShoppingCart className="h-6 w-6 text-blue-600" />;
        case 'equipment':
            return <Tractor className="h-6 w-6 text-orange-600" />;
    }
}


export default function ExchangeComponent() {
  const { t } = useLanguage();

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2">
            <ArrowRightLeft />
            {t('exchange.title')}
        </CardTitle>
        <CardDescription>{t('exchange.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">
                <Search className="mr-2 h-4 w-4" />
                {t('exchange.buyTitle')}
            </TabsTrigger>
            <TabsTrigger value="sell">
                <ShoppingCart className="mr-2 h-4 w-4" />
                {t('exchange.sellTitle')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="buy">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {dummyBuyRequests.map((req) => (
                    <Card key={req.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                {getIcon(req.type)}
                                {req.item}
                            </CardTitle>
                            <CardDescription>
                                {t('exchange.quantity')}: {req.quantity}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-medium">{t('exchange.postedBy')}: {req.farmer}</p>
                            <p className="text-sm text-muted-foreground">{req.location}</p>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full">
                                <Phone className="mr-2 h-4 w-4" />
                                {t('exchange.contact')}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="sell">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {dummySellOffers.map((offer) => (
                    <Card key={offer.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                {getIcon(offer.type)}
                                {offer.item}
                            </CardTitle>
                            <CardDescription>
                                {t('exchange.quantity')}: {offer.quantity}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-medium">{t('exchange.postedBy')}: {offer.farmer}</p>
                            <p className="text-sm text-muted-foreground">{offer.location}</p>
                        </CardContent>
                        <CardFooter>
                           <Button className="w-full">
                                <Phone className="mr-2 h-4 w-4" />
                                {t('exchange.contact')}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
