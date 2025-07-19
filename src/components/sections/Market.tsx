'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMarketInsights } from '@/ai/flows/get-market-insights';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const DUMMY_MARKET_API_URL = 'https://dummyjson.com/products/1';

export default function MarketComponent() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!query.trim()) {
      toast({ title: "Error", description: "Please enter a query for market analysis.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const marketResponse = await fetch(DUMMY_MARKET_API_URL);
      if (!marketResponse.ok) {
        throw new Error(`HTTP error! status: ${marketResponse.status}`);
      }
      const marketData = await marketResponse.json();

      const analysisResult = await getMarketInsights({
        cropQuery: query,
        marketData: JSON.stringify(marketData),
      });

      setResult(analysisResult.marketSummary);
      toast({ title: "Success", description: "Market analysis complete." });
    } catch (error) {
      console.error("Error getting market analysis:", error);
      setResult(`Error: ${(error as Error).message}. Please try again.`);
      toast({ title: "Analysis Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">Real-Time Market Analysis</CardTitle>
        <CardDescription>Ask about market prices to guide your selling decisions (e.g., "What is the price of tomatoes today?").</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query here..."
          className="min-h-[100px]"
        />
        <Button onClick={handleAnalyze} disabled={loading} className="w-full">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? 'Analyzing Market...' : 'Get Market Analysis'}
        </Button>
        {result && (
          <div className="mt-6 p-4 bg-accent/20 border rounded-lg">
            <h3 className="text-lg font-headline font-semibold text-primary mb-2">Market Analysis:</h3>
            <div className="text-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }}></div>
            <p className="mt-4 text-xs text-muted-foreground">
              <strong>Note:</strong> Market data is from a dummy source for demonstration purposes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
