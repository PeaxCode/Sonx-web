import type { Metadata } from "next";
import { Suspense } from "react";
import { preconnect } from "react-dom";
import { CheckoutView } from "@/components/pricing/checkout-view";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

type Props = { searchParams: Promise<{ price?: string }> };

async function Checkout({ searchParams }: Props) {
  const { price } = await searchParams;
  return <CheckoutView priceId={price ?? ""} />;
}

/** Sonx checkout: our order summary with Paddle's payment form inline (components/pricing/checkout-view.tsx). */
export default function CheckoutPage({ searchParams }: Props) {
  // Paddle.js and its checkout frame come from these hosts; connect while the page loads.
  preconnect("https://cdn.paddle.com");
  preconnect(process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox" ? "https://sandbox-buy.paddle.com" : "https://buy.paddle.com");
  return (
    <Suspense fallback={<div className="h-[70vh]" />}>
      <Checkout searchParams={searchParams} />
    </Suspense>
  );
}
