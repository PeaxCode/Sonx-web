import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutView } from "@/components/pricing/checkout-view";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

type Props = { searchParams: Promise<{ price?: string }> };

async function Checkout({ searchParams }: Props) {
  const { price } = await searchParams;
  return <CheckoutView priceId={price ?? ""} />;
}

/** Sonx checkout: our order summary with Paddle's payment form inline (components/pricing/checkout-view.tsx). */
export default function CheckoutPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div className="h-[70vh]" />}>
      <Checkout searchParams={searchParams} />
    </Suspense>
  );
}
