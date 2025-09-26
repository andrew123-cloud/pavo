// src/app/recommendations/page.tsx
'use client';

import React, { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { getPersonalizedRecommendations } from '@/app/(public)/recommendations/actions';
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
import { Label } from '@/components/ui/label';
import { Lightbulb, Loader2, ShoppingBasket, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        'Get Recommendations'
      )}
    </Button>
  );
}

export default function RecommendationsPage() {
  const initialState = { message: null, errors: {}, data: null };
  const [state, dispatch] = useActionState(
    getPersonalizedRecommendations,
    initialState
  );

  return (
    <div className="dark bg-background text-foreground min-h-screen">
      <div className="container mx-auto max-w-5xl px-4 py-20 md:py-32">
        <div className="text-center">
          <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            Personalized AI Assistant
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground">
            Tell us about your style, and our AI will generate personalized
            interior design tips and product recommendations just for you.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Card className="bg-secondary/50 border-0 shadow-lg">
              <form action={dispatch}>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">Your Style Profile</CardTitle>
                  <CardDescription>
                    The more details you provide, the better the recommendations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="preferences">
                      Describe your dream space, favorite colors, and styles.
                    </Label>
                    <Textarea
                      id="preferences"
                      name="preferences"
                      placeholder="e.g., I love a cozy, minimalist living room with warm neutral colors, natural wood, and lots of light."
                      rows={6}
                      required
                      className="bg-background/50"
                    />
                    {state.errors?.preferences && (
                      <p className="text-sm font-medium text-destructive">
                        {state.errors.preferences[0]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="browsingHistory">
                      Paste links to products or styles you like (optional).
                    </Label>
                    <Textarea
                      id="browsingHistory"
                      name="browsingHistory"
                      placeholder="https://pavodecors.com/products/linen-pillow..."
                      rows={4}
                      className="bg-background/50"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <SubmitButton />
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="md:col-span-7">
            <div className="space-y-8">
              {state.errors?.server && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{state.errors.server[0]}</AlertDescription>
                </Alert>
              )}

              {!state.data && !state.errors?.server && (
                <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-secondary">
                  <div className="text-center text-muted-foreground">
                    <Lightbulb className="mx-auto h-16 w-16" />
                    <p className="mt-4 text-lg">Your recommendations will appear here.</p>
                  </div>
                </div>
              )}

              {state.data && (
                <div className="space-y-8">
                  <Card className="bg-secondary/50 border-0">
                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                      <Lightbulb className="h-8 w-8 text-primary" />
                      <CardTitle className="m-0 font-headline text-3xl">
                        Design Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc space-y-3 pl-6 text-muted-foreground text-base">
                        {state.data.tips.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-secondary/50 border-0">
                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                      <ShoppingBasket className="h-8 w-8 text-primary" />
                      <CardTitle className="m-0 font-headline text-3xl">
                        Product Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc space-y-3 pl-6 text-muted-foreground text-base">
                        {state.data.productRecommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
