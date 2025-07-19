'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSchemeInformation } from '@/ai/flows/get-scheme-information';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const GOVERNMENT_SCHEME_DOCS = [
    {
        title: "Pradhan Mantri Krishi Sinchai Yojana (PMKSY) - Drip Irrigation",
        content: `The Pradhan Mantri Krishi Sinchai Yojana (PMKSY) aims to expand cultivated area under assured irrigation, improve on-farm water use efficiency to reduce wastage of water, enhance the adoption of precision irrigation (Drip and Sprinkler), recharge aquifers and introduce sustainable water conservation practices.
        Eligibility: All farmers are eligible. Priority is given to small and marginal farmers.
        Benefits: Financial assistance for installation of drip and sprinkler irrigation systems.
        Application Link: https://pmksy.gov.in/`
    },
    {
        title: "Soil Health Card Scheme",
        content: `The Soil Health Card (SHC) scheme is promoted by the Department of Agriculture & Farmers Welfare, Ministry of Agriculture & Farmers Welfare. It aims at promoting Integrated Nutrient Management (INM) through judicious use of chemicals and organic fertilizers including bio-fertilizers and also soil test based balanced use of fertilizers.
        Eligibility: All farmers with agricultural land.
        Benefits: Provides a detailed report on soil nutrient status and recommendations for fertilizer use.
        Application Link: https://soilhealth.dac.gov.in/`
    },
    {
        title: "Kisan Credit Card (KCC) Scheme",
        content: `The Kisan Credit Card (KCC) scheme provides adequate and timely credit support from the banking system to the farmers for their cultivation needs. This includes short term credit for crop production, post-harvest expenses, produce marketing loan, consumption requirements of farmer household, working capital for maintenance of farm assets and activities allied to agriculture, and investment credit for agriculture and allied activities.
        Eligibility: Farmers - individual/joint cultivators, tenant farmers, oral lessees & sharecroppers, SHGs/Joint Liability Groups of farmers.
        Benefits: Access to credit at low interest rates.
        Application Link: https://www.sbi.co.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card`
    }
];

export default function SchemesComponent() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({ title: "Error", description: "Please enter a query for government schemes.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const searchResult = await getSchemeInformation({
        schemeQuery: query,
        schemeDocuments: GOVERNMENT_SCHEME_DOCS,
      });

      setResult(searchResult.schemeInformation);
      toast({ title: "Success", description: "Scheme information retrieved." });
    } catch (error) {
      console.error("Error getting scheme info:", error);
      setResult(`Error: ${(error as Error).message}. Please try again.`);
      toast({ title: "Search Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">Navigate Government Schemes</CardTitle>
        <CardDescription>Ask about government schemes to find eligibility and application info (e.g., "subsidies for drip irrigation").</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query here..."
          className="min-h-[100px]"
        />
        <Button onClick={handleSearch} disabled={loading} className="w-full">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? 'Searching Schemes...' : 'Get Scheme Information'}
        </Button>
        {result && (
          <div className="mt-6 p-4 bg-accent/20 border rounded-lg">
            <h3 className="text-lg font-headline font-semibold text-primary mb-2">Government Scheme Information:</h3>
            <div className="text-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />').replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')}}></div>
            <p className="mt-4 text-xs text-muted-foreground">
              <strong>Note:</strong> Scheme information is based on a predefined set of documents for this demo.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
