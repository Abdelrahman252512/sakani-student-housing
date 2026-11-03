type AnalyticsData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track(name: string, data?: AnalyticsData): void;
    };
  }
}

export function trackEvent(name: string, data?: AnalyticsData): void {
  if (typeof window === "undefined") return;

  try {
    window.umami?.track(name, data);
  } catch {
    // Analytics must never break the app.
  }
}

type ListingDimensions = {
  type?: unknown;
  city?: unknown;
  gender?: unknown;
};

function listingAnalyticsData(property: ListingDimensions): AnalyticsData {
  const category = (value: unknown) =>
    typeof value === "string" && value.trim() ? value.trim() : "unknown";

  return {
    property_type: category(property.type),
    city: category(property.city),
    gender: category(property.gender),
  };
}

export function trackListingStatusChange(
  property: ListingDimensions,
  fromStatus: string,
  toStatus: string,
): void {
  trackEvent("listing_status_changed", {
    ...listingAnalyticsData(property),
    from_status: fromStatus,
    to_status: toStatus,
  });
}

function trackListingReviewDecision(
  decision: "approved" | "rejected",
  property: ListingDimensions,
): void {
  trackEvent(`listing_review_${decision}`, listingAnalyticsData(property));
}

export async function trackListingReviewMutation<T extends { property?: { status?: unknown } }>(
  decision: "approved" | "rejected",
  property: ListingDimensions,
  fromStatus: string,
  update: () => Promise<T>,
): Promise<T> {
  const result = await update();
  const expectedStatus = decision === "approved" ? "published" : "rejected";

  if (result.property?.status === expectedStatus) {
    trackListingReviewDecision(decision, property);
    trackListingStatusChange(property, fromStatus, expectedStatus);
  }

  return result;
}

type PropertyVerification = {
  propertyId?: unknown;
  status?: unknown;
  type?: unknown;
};

const PROPERTY_VERIFICATION_TYPES = new Set([
  "ملكية العقار",
  "هوية المالك",
  "حق التأجير من الباطن",
  "معاينة ميدانية",
]);

export function trackPropertyVerificationDecision(
  verification: PropertyVerification,
  property: ListingDimensions,
): void {
  if (typeof verification.propertyId !== "number" || verification.propertyId <= 0) return;
  if (verification.status !== "approved" && verification.status !== "rejected") return;

  const verificationType =
    typeof verification.type === "string" && PROPERTY_VERIFICATION_TYPES.has(verification.type)
      ? verification.type
      : "other";

  trackEvent("property_verification_decided", {
    decision: verification.status,
    verification_type: verificationType,
    ...listingAnalyticsData(property),
  });
}

export type BookingOutcomeAction = "accept" | "reject" | "cancel" | "complete" | "confirm";
export type BookingActorRole = "student" | "owner" | "admin";

const BOOKING_OUTCOME_STATUSES: Record<BookingOutcomeAction, string> = {
  accept: "awaiting_payment",
  reject: "rejected",
  cancel: "cancelled",
  complete: "completed",
  confirm: "confirmed",
};

export async function trackBookingOutcome<T extends { booking?: { status?: string } }>(
  action: BookingOutcomeAction,
  actorRole: BookingActorRole,
  update: () => Promise<T>,
): Promise<T> {
  const result = await update();
  const status = BOOKING_OUTCOME_STATUSES[action];

  if (result.booking?.status === status) {
    trackEvent("booking_status_changed", { actor_role: actorRole, status });
  }

  return result;
}
