import { CheckoutEventNames, initializePaddle, type Paddle, type PaddleEventData } from "@paddle/paddle-js";

/**
 * Web checkout through Paddle. RevenueCat reads each purchase from Paddle's
 * notifications and attaches it to the user named in customData: plans unlock
 * the shared pro_access entitlement, credit packs land in the shared credit
 * ledger. The key must match the "Metadata field key" in RevenueCat's Paddle settings.
 */
export const REVENUECAT_USER_KEY = "app_user_id";

export type WebPlan = "WEEKLY" | "MONTHLY" | "YEARLY";
export type CreditPackId = "mini" | "starter" | "pro" | "studio";

const PLAN_PRICE_IDS: Record<WebPlan, string | undefined> = {
  WEEKLY: process.env.NEXT_PUBLIC_PADDLE_PRICE_WEEKLY,
  MONTHLY: process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY,
  YEARLY: process.env.NEXT_PUBLIC_PADDLE_PRICE_YEARLY,
};

// Credit amounts are mirrored on the server in PADDLE_CREDIT_PRODUCTS, which is authoritative.
const PACKS: { id: CreditPackId; credits: number; priceId: string | undefined }[] = [
  { id: "mini", credits: 40, priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_MINI },
  { id: "starter", credits: 95, priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_STARTER },
  { id: "pro", credits: 210, priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_PRO },
  { id: "studio", credits: 445, priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_STUDIO },
];

const TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
const ENVIRONMENT = process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox" ? "sandbox" : "production";

/** Plans that have a Paddle price configured, in display order. */
export const WEB_PLANS = (["WEEKLY", "MONTHLY", "YEARLY"] as const).filter((plan) => PLAN_PRICE_IDS[plan]);
/** Credit packs that have a Paddle price configured, smallest first. */
export const CREDIT_PACKS = PACKS.filter((pack): pack is typeof pack & { priceId: string } => Boolean(pack.priceId));

/** False until the client token and at least one plan price are set; the UI falls back to the app. */
export const webCheckoutEnabled = Boolean(TOKEN) && WEB_PLANS.length > 0;
export const webCreditsEnabled = Boolean(TOKEN) && CREDIT_PACKS.length > 0;

export const planPriceId = (plan: WebPlan) => PLAN_PRICE_IDS[plan];

/** A localized price: `formatted` for display, `amount` in major units for per-song maths. */
export interface WebPrice {
  formatted: string;
  amount: number;
  currency: string;
}

let completedListener: (() => void) | null = null;
let paddlePromise: Promise<Paddle | undefined> | null = null;
let pricesPromise: Promise<Record<string, WebPrice>> | null = null;

function onPaddleEvent(event: PaddleEventData) {
  if (event.name === CheckoutEventNames.CHECKOUT_COMPLETED) completedListener?.();
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

const ZERO_DECIMAL = new Set(["JPY", "KRW", "CLP"]);

/**
 * Prices for every configured plan and pack, keyed by Paddle price ID, in the
 * visitor's currency with tax. Fetched once per page load and shared.
 */
export function fetchWebPrices(): Promise<Record<string, WebPrice>> {
  pricesPromise ??= (async () => {
    const paddle = await getPaddle();
    const priceIds = [...WEB_PLANS.map((plan) => PLAN_PRICE_IDS[plan]!), ...CREDIT_PACKS.map((pack) => pack.priceId)];
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

/** Formats a per-unit amount in the same currency as a Paddle price, e.g. "$0.25". */
export function formatPerUnit(price: WebPrice, units: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: price.currency }).format(price.amount / units);
}

/** Opens the Paddle overlay for one price; onCompleted runs once payment succeeds. */
export async function openWebCheckout(options: {
  priceId: string;
  userId: string;
  email: string | null;
  onCompleted: () => void;
}) {
  const paddle = await getPaddle();
  if (!paddle) throw new Error("Checkout is unavailable right now. Try again in a moment.");
  completedListener = options.onCompleted;
  paddle.Checkout.open({
    items: [{ priceId: options.priceId, quantity: 1 }],
    ...(options.email ? { customer: { email: options.email } } : {}),
    customData: { [REVENUECAT_USER_KEY]: options.userId },
    settings: { displayMode: "overlay", theme: "dark", allowLogout: false },
  });
}
