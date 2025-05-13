"use client";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

export default function Home() {
  const form = useForm();

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header activeRoute="mint" />
      <main className="flex flex-1 items-center justify-center mb-[20vh] px-6">
        <Card className="w-lg">
          <CardContent>
            <div className="flex flex-col gap-2 [&_.input]:h-20 [&_.input]:text-right [&_.input]:text-lg">
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="colateral"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collateral</FormLabel>
                      <FormControl>
                        <CurrencyInput className="input" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minted</FormLabel>
                      <FormControl>
                        <CurrencyInput className="input" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </Form>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
