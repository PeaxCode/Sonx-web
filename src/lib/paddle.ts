import { CheckoutEventNames, initializePaddle, type Paddle, type PaddleEventData } from "@paddle/paddle-js";
import { trackEvent } from "@/lib/analytics";

/**
 * Web checkout through Paddle. RevenueCat reads each purchase from Paddle's
 * notifications and attaches it to the user named in customData: plans unlock
 * the shared pro_access entitlement, credit packs land in the shared credit
 * ledger. The key must match the "Metadata field key" in RevenueCat's Paddle settings.
 */
export const REVENUECAT_USER_KEY = "app_user_id";

/** Web tiers. Pro uses the server's MONTHLY quota, Studio its STUDIO quota. */
export type WebTier = "PRO" | "STUDIO";
export type BillingCycle = "monthly" | "yearly";

const PLAN_PRICE_IDS: Record<WebTier, Record<BillingCycle, string | undefined>> = {
  PRO: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY,
    yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY,
  },
  STUDIO: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_STUDIO_MONTHLY,
    yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_STUDIO_YEARLY,
  },
};

// Credit amounts are mirrored on the server in PADDLE_CREDIT_PRODUCTS, which is authoritative.
const PACKS: { credits: number; priceId: string | undefined }[] = [
  { credits: 100, priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_100 },
  { credits: 250, priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_250 },
  { credits: 600, priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_600 },
  { credits: 1500, priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_1500 },
];

const TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
const ENVIRONMENT = process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox" ? "sandbox" : "production";

/**
 * USD list prices, tax included, as set in Paddle. They are in the server HTML
 * (search engines, first paint) and are replaced by Paddle's localized prices
 * once they load. Keep in step with the Paddle catalog.
 */
export const LIST_PRICES_USD = {
  plans: { PRO: { monthly: 5.99, yearly: 59.88 }, STUDIO: { monthly: 14.99, yearly: 143.88 } },
  credits: { 100: 2.99, 250: 5.99, 600: 11.99, 1500: 24.99 } as Record<number, number>,
} satisfies { plans: Record<WebTier, Record<BillingCycle, number>>; credits: Record<number, number> };

const usd = (amount: number): WebPrice => ({
  formatted: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount),
  amount,
  currency: "USD",
});

/** LIST_PRICES_USD keyed by Paddle price ID, the shape fetchWebPrices returns. */
export function listPrices(): Record<string, WebPrice> {
  const entries: [string, WebPrice][] = [];
  for (const tier of ["PRO", "STUDIO"] as const) {
    for (const cycle of ["monthly", "yearly"] as const) {
      const id = PLAN_PRICE_IDS[tier][cycle];
      if (id) entries.push([id, usd(LIST_PRICES_USD.plans[tier][cycle])]);
    }
  }
  for (const pack of PACKS) {
    const amount = LIST_PRICES_USD.credits[pack.credits];
    if (pack.priceId && amount) entries.push([pack.priceId, usd(amount)]);
  }
  return Object.fromEntries(entries);
}

/** Tiers with both a monthly and a yearly price configured, in display order. */
export const WEB_TIERS = (["PRO", "STUDIO"] as const).filter(
  (tier) => PLAN_PRICE_IDS[tier].monthly && PLAN_PRICE_IDS[tier].yearly,
);
/** Credit packs that have a Paddle price configured, smallest first. */
export const CREDIT_PACKS = PACKS.filter((pack): pack is typeof pack & { priceId: string } => Boolean(pack.priceId));

/** False until the client token and at least one tier are set; the UI falls back to the app. */
export const webCheckoutEnabled = Boolean(TOKEN) && WEB_TIERS.length > 0;
export const webCreditsEnabled = Boolean(TOKEN) && CREDIT_PACKS.length > 0;

/** Switches the open checkout to another price (monthly <-> yearly) without reloading the frame. */
export async function switchCheckoutPrice(priceId: string) {
  const paddle = await getPaddle();
  if (!paddle || !openCheckout) return;
  openCheckout.priceId = priceId;
  paddle.Checkout.updateItems([{ priceId, quantity: 1 }]);
}

export async function closeWebCheckout() {
  const paddle = await getPaddle();
  paddle?.Checkout.close();
  openCheckout = null;
}

export type PriceInfo =
  | { kind: "plan"; tier: WebTier; cycle: BillingCycle }
  | { kind: "credits"; credits: number };

/** What a configured price ID sells; null for anything else, so /checkout?price= cannot sell unknown items. */
export function describePrice(priceId: string | null | undefined): PriceInfo | null {
  if (!priceId) return null;
  for (const tier of ["PRO", "STUDIO"] as const) {
    for (const cycle of ["monthly", "yearly"] as const) {
      if (PLAN_PRICE_IDS[tier][cycle] === priceId) return { kind: "plan", tier, cycle };
    }
  }
  const pack = PACKS.find((item) => item.priceId === priceId);
  return pack ? { kind: "credits", credits: pack.credits } : null;
}

export const planPriceId = (tier: WebTier, cycle: BillingCycle) => PLAN_PRICE_IDS[tier][cycle];

/** A localized price: `formatted` for display, `amount` in major units for per-song maths. */
export interface WebPrice {
  formatted: string;
  amount: number;
  currency: string;
}

let completedListener: (() => void) | null = null;
/** The checkout on screen, for analytics: what is being bought and whether it was paid. */
let openCheckout: { priceId: string; kind: CheckoutKind; completed: boolean; inline: boolean } | null = null;
let paddlePromise: Promise<Paddle | undefined> | null = null;
let pricesPromise: Promise<Record<string, WebPrice>> | null = null;

// Long enough to show Paddle's "payment successful" step, short enough that
// buyers are not left on it wondering what to do next.
const CLOSE_AFTER_COMPLETED_MS = 1500;

export type CheckoutKind = "plan" | "credits";

/** Live totals of the checkout on screen, for the summary next to the inline frame. */
export interface CheckoutTotals {
  currency: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  /** Recurring charge after the first one, for plans. */
  recurringTotal: number | null;
}

const totalsListeners = new Set<(totals: CheckoutTotals) => void>();

/** Calls `listener` whenever Paddle reports new totals (country, tax ID, currency changes). */
export function onCheckoutTotals(listener: (totals: CheckoutTotals) => void) {
  totalsListeners.add(listener);
  return () => {
    totalsListeners.delete(listener);
  };
}

function onPaddleEvent(event: PaddleEventData) {
  if ((event.name === CheckoutEventNames.CHECKOUT_LOADED || event.name === CheckoutEventNames.CHECKOUT_UPDATED ||
    event.name === CheckoutEventNames.CHECKOUT_ITEMS_UPDATED) && event.data?.totals) {
    const { totals, recurring_totals: recurring, currency_code: currency } = event.data;
    const update = {
      currency,
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
      recurringTotal: recurring?.total ?? null,
    };
    totalsListeners.forEach((listener) => listener(update));
  }
  if (event.name === CheckoutEventNames.CHECKOUT_CLOSED) {
    // Closed without paying: the abandoned half of checkout_start.
    if (openCheckout && !openCheckout.completed) {
      trackEvent("checkout_closed", { kind: openCheckout.kind, price_id: openCheckout.priceId });
    }
    openCheckout = null;
    return;
  }
  if (event.name !== CheckoutEventNames.CHECKOUT_COMPLETED) return;
  const inline = openCheckout?.inline ?? false;
  if (openCheckout) {
    openCheckout.completed = true;
    const data = event.data;
    // GA4's purchase event; value is what the buyer paid, tax included, in major units.
    const params = {
      transaction_id: data?.transaction_id,
      currency: data?.currency_code,
      value: data?.totals?.total,
      items: data?.items.map((item) => ({ item_id: item.price_id, item_name: item.price_name ?? item.product?.name, quantity: item.quantity })),
      kind: openCheckout.kind,
    };
    trackEvent("purchase", params);
    if (openCheckout.kind === "credits") trackEvent("credit_pack_purchase", params);
  }
  const listener = completedListener;
  completedListener = null;
  listener?.();
  // The overlay closes itself after the success step; the inline frame belongs to a page that navigates away.
  if (!inline) {
    window.setTimeout(() => {
      void paddlePromise?.then((paddle) => paddle?.Checkout.close());
    }, CLOSE_AFTER_COMPLETED_MS);
  }
}

function getPaddle() {
  if (!TOKEN) return Promise.resolve(undefined);
  paddlePromise ??= initializePaddle({ token: TOKEN, environment: ENVIRONMENT, eventCallback: onPaddleEvent })
    .catch(() => {
      // Let the next attempt load the script again (blocked or offline).
      paddlePromise = null;
      return undefined;
    });
  return paddlePromise;
}

/** Starts loading Paddle.js ahead of use (checkout page, plan buttons). */
export function preloadPaddle() {
  return getPaddle();
}

const ZERO_DECIMAL = new Set(["JPY", "KRW", "CLP"]);

/**
 * Prices for every configured plan and pack, keyed by Paddle price ID, in the
 * visitor's currency with tax. Fetched once per page load and shared.
 */
export function fetchWebPrices(): Promise<Record<string, WebPrice>> {
  pricesPromise ??= (async () => {
    const paddle = await getPaddle();
    const priceIds = [
      ...WEB_TIERS.flatMap((tier) => [PLAN_PRICE_IDS[tier].monthly!, PLAN_PRICE_IDS[tier].yearly!]),
      ...CREDIT_PACKS.map((pack) => pack.priceId),
    ];
    if (!paddle || priceIds.length === 0) return {};
    const response = await paddle.PricePreview({ items: priceIds.map((priceId) => ({ priceId, quantity: 1 })) });
    const currency = response.data.currencyCode;
    const divisor = ZERO_DECIMAL.has(currency) ? 1 : 100;
    return Object.fromEntries(
      response.data.details.lineItems.map((item) => [
        item.price.id,
        { formatted: item.formattedTotals.total, amount: Number(item.totals.total) / divisor, currency },
      ]),
    );
  })().catch(() => {
    pricesPromise = null;
    return {};
  });
  return pricesPromise;
}

/**
 * Formats an amount in the same currency as a Paddle price, e.g. formatMoney(price, price.amount / 12).
 * Fixed to en-US like the rest of the site: with the default locale the server and the
 * visitor's browser format differently ("$4,99" vs "$4.99") and hydration fails.
 */
export function formatMoney(price: WebPrice, amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: price.currency }).format(amount);
}

/**
 * Opens the Paddle overlay for one price; onCompleted runs once payment
 * succeeds and the overlay then closes itself. Quantity is fixed at one: the
 * prices allow only one unit, and paddle-webhook grants credits x quantity anyway.
 */
export async function openWebCheckout(options: {
  priceId: string;
  kind: CheckoutKind;
  userId: string;
  email: string | null;
  onCompleted: () => void;
  /** Renders into the element with this class (the /checkout page) instead of the overlay. */
  inlineTarget?: string;
}) {
  const paddle = await getPaddle();
  if (!paddle) throw new Error("Checkout is unavailable right now. Try again in a moment.");
  completedListener = options.onCompleted;
  openCheckout = { priceId: options.priceId, kind: options.kind, completed: false, inline: Boolean(options.inlineTarget) };
  trackEvent("checkout_start", { kind: options.kind, price_id: options.priceId });
  paddle.Checkout.open({
    items: [{ priceId: options.priceId, quantity: 1 }],
    ...(options.email ? { customer: { email: options.email } } : {}),
    customData: { [REVENUECAT_USER_KEY]: options.userId },
    // No coupons are offered, so the discount field would only send buyers looking for one.
    settings: options.inlineTarget
      ? {
        displayMode: "inline",
        variant: "one-page",
        frameTarget: options.inlineTarget,
        frameInitialHeight: 450,
        frameStyle: "width: 100%; min-width: 312px; background-color: transparent; border: none;",
        theme: "dark",
        allowLogout: false,
        showAddDiscounts: false,
      }
      : { displayMode: "overlay", theme: "dark", allowLogout: false, showAddDiscounts: false },
  });
}
