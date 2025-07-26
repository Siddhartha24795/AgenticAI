
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, LineChart, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "../ui/skeleton";
import { useLanguage } from "@/hooks/use-language";

export default function HomeComponent() {
    const { user, isAuthReady } = useAuth();
    const { t } = useLanguage();
    const userName = user?.displayName || (user?.isAnonymous ? t('home.farmer') : 'Siddhartha Mishra');

    if (!isAuthReady) {
        return (
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="text-center">
                    <Skeleton className="h-10 w-3/4 mx-auto" />
                    <Skeleton className="h-6 w-1/2 mx-auto mt-2" />
                </CardHeader>
                <CardContent className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="text-center">
                <CardTitle className="text-4xl font-headline text-primary">{t('home.welcome')} {userName}!</CardTitle>
                <CardDescription className="text-lg text-foreground/80 mt-2 max-w-2xl mx-auto">
                    {t('home.description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link
                        href="/diagnose"
                        className="p-6 bg-card rounded-lg shadow-lg cursor-pointer transform hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center text-center group"
                    >
                        <div className="bg-green-100 p-4 rounded-full mb-4">
                          <Leaf className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-headline font-semibold text-card-foreground group-hover:text-primary transition-colors">{t('home.diagnoseTitle')}</h3>
                        <p className="text-card-foreground/70 mt-2 text-sm">{t('home.diagnoseDesc')}</p>
                    </Link>
                     <Link
                        href="/market"
                        className="p-6 bg-card rounded-lg shadow-lg cursor-pointer transform hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center text-center group"
                    >
                        <div className="bg-blue-100 p-4 rounded-full mb-4">
                          <LineChart className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-headline font-semibold text-card-foreground group-hover:text-primary transition-colors">{t('home.marketTitle')}</h3>
                        <p className="text-card-foreground/70 mt-2 text-sm">{t('home.marketDesc')}</p>
                    </Link>
                     <Link
                        href="/schemes"
                        className="p-6 bg-card rounded-lg shadow-lg cursor-pointer transform hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center text-center group"
                    >
                        <div className="bg-purple-100 p-4 rounded-full mb-4">
                           <ShieldCheck className="w-10 h-10 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-headline font-semibold text-card-foreground group-hover:text-primary transition-colors">{t('home.schemesTitle')}</h3>
                        <p className="text-card-foreground/70 mt-2 text-sm">{t('home.schemesDesc')}</p>
                    </Link>
                </div>
                {user?.uid && (
                    <p className="mt-12 text-center text-xs text-muted-foreground">
                        {t('home.userId')} <span className="font-mono">{user.uid}</span>
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
