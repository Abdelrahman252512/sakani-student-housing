import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { trackBookingOutcome, trackListingReviewMutation, trackPropertyVerificationDecision } from "./analytics.ts";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
let events = [];

function installAnalytics() {
  events = [];
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { umami: { track: (name, properties) => events.push({ name, properties }) } },
  });
}

afterEach(() => {
  if (originalWindow) {
    Object.defineProperty(globalThis, "window", originalWindow);
  } else {
    delete globalThis.window;
  }
});

for (const { action, actorRole, status } of [
  { action: "accept", actorRole: "owner", status: "awaiting_payment" },
  { action: "reject", actorRole: "owner", status: "rejected" },
  { action: "cancel", actorRole: "student", status: "cancelled" },
  { action: "complete", actorRole: "admin", status: "completed" },
  { action: "confirm", actorRole: "student", status: "confirmed" },
]) {
  test(`tracks ${action} once with its resulting status and actor role`, async () => {
    installAnalytics();
    let requestCount = 0;

    const result = await trackBookingOutcome(action, actorRole, async () => {
      requestCount += 1;
      return { booking: { status, id: 4812, student: { name: "Private name" } } };
    });

    assert.equal(requestCount, 1);
    assert.deepEqual(result.booking, {
      status,
      id: 4812,
      student: { name: "Private name" },
    });
    assert.deepEqual(events, [{
      name: "booking_status_changed",
      properties: { actor_role: actorRole, status },
    }]);
  });
}

test("does not track a failed booking request", async () => {
  installAnalytics();
  const failure = new Error("Request failed");

  await assert.rejects(
    trackBookingOutcome("accept", "owner", async () => {
      throw failure;
    }),
    failure,
  );
  assert.deepEqual(events, []);
});

test("does not track a response whose status does not match the requested action", async () => {
  installAnalytics();

  await trackBookingOutcome("accept", "owner", async () => ({
    booking: { status: "pending_owner" },
  }));

  assert.deepEqual(events, []);
});

test("does not track declined or still-pending payment responses as confirmations", async () => {
  for (const status of ["payment_declined", "awaiting_payment"]) {
    installAnalytics();

    await trackBookingOutcome("confirm", "student", async () => ({
      booking: { status, payment: { cardholderName: "Private name" } },
    }));

    assert.deepEqual(events, []);
  }
});

test("does not track a failed payment request as a confirmation", async () => {
  installAnalytics();

  await assert.rejects(
    trackBookingOutcome("confirm", "student", async () => {
      throw new Error("Payment declined");
    }),
    /Payment declined/,
  );

  assert.deepEqual(events, []);
});

for (const { decision, status } of [
  { decision: "approved", status: "published" },
  { decision: "rejected", status: "rejected" },
]) {
  test(`tracks a successful ${decision} only after the expected listing status is returned`, async () => {
    installAnalytics();
    const listing = {
      type: "شقة كاملة",
      city: "دمياط",
      gender: "بنات",
      status: "pending_review",
      title: "private listing title",
      rejectReason: "private rejection note",
    };
    const rejectionNote = "private rejection note";

    const result = await trackListingReviewMutation(decision, listing, listing.status, async () => {
      assert.deepEqual(events, []);
      const mutationInput = decision === "rejected" ? { reason: rejectionNote } : {};
      assert.equal(mutationInput.reason, decision === "rejected" ? rejectionNote : undefined);
      return { property: { status }, mutationInput };
    });

    assert.equal(result.property.status, status);
    const expectedCategoryData = {
      property_type: "شقة كاملة",
      city: "دمياط",
      gender: "بنات",
    };
    assert.deepEqual(events, [
      { name: `listing_review_${decision}`, properties: expectedCategoryData },
      {
        name: "listing_status_changed",
        properties: {
          ...expectedCategoryData,
          from_status: "pending_review",
          to_status: status,
        },
      },
    ]);

    const payloadText = JSON.stringify(events);
    assert.equal(payloadText.includes(listing.title), false);
    assert.equal(payloadText.includes(rejectionNote), false);
    assert.equal(payloadText.includes("rejectReason"), false);
    assert.equal(payloadText.includes("reason"), false);
  });
}

test("does not track a failed listing review mutation", async () => {
  installAnalytics();
  const failure = new Error("Review failed");

  await assert.rejects(
    trackListingReviewMutation("rejected", {
      type: "شقة كاملة",
      city: "دمياط",
      gender: "بنات",
    }, "pending_review", async () => {
      throw failure;
    }),
    failure,
  );

  assert.deepEqual(events, []);
});

test("does not track a listing review response with the wrong resulting status", async () => {
  installAnalytics();

  for (const { decision, status } of [
    { decision: "approved", status: "rejected" },
    { decision: "rejected", status: "published" },
  ]) {
    await trackListingReviewMutation(decision, {}, "pending_review", async () => ({
      property: { status },
    }));
  }

  assert.deepEqual(events, []);
});

test("listing review flow succeeds when analytics is unavailable or throws", async () => {
  const listing = { type: "استوديو", city: "المنصورة", gender: "الكل" };
  delete globalThis.window;

  const result = await trackListingReviewMutation("approved", listing, "pending_review", async () => ({
    property: { status: "published" },
  }));
  assert.equal(result.property.status, "published");

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { umami: { track: () => { throw new Error("analytics unavailable"); } } },
  });
  const resultWithThrowingAnalytics = await trackListingReviewMutation("rejected", listing, "pending_review", async () => ({
    property: { status: "rejected" },
  }));
  assert.equal(resultWithThrowingAnalytics.property.status, "rejected");
});

test("tracks only categorical dimensions for successful property verification decisions", () => {
  installAnalytics();

  trackPropertyVerificationDecision({
    propertyId: 42,
    status: "rejected",
    type: "ملكية العقار",
    documentName: "private-title-deed.pdf",
    evidenceNote: "private evidence",
    reason: "free-form rejection reason",
  }, { type: "شقة كاملة", city: "دمياط", gender: "بنات", title: "private listing title" });

  assert.deepEqual(events, [{
    name: "property_verification_decided",
    properties: {
      decision: "rejected",
      verification_type: "ملكية العقار",
      property_type: "شقة كاملة",
      city: "دمياط",
      gender: "بنات",
    },
  }]);
});

test("does not track account verification, pending decisions, or unrecognized verification text", () => {
  installAnalytics();

  trackPropertyVerificationDecision({ status: "approved", type: "هوية المالك" }, {});
  trackPropertyVerificationDecision({ propertyId: 42, status: "pending", type: "هوية المالك" }, {});
  trackPropertyVerificationDecision({
    propertyId: 42,
    status: "approved",
    type: "sensitive free-form text",
  }, {});

  assert.equal(events.length, 1);
  assert.equal(events[0].properties.verification_type, "other");
  assert.equal(events[0].properties.decision, "approved");
  assert.equal(events[0].properties.property_type, "unknown");
});

test("property verification tracking stays safe when analytics is unavailable or throws", () => {
  delete globalThis.window;
  assert.doesNotThrow(() => trackPropertyVerificationDecision({
    propertyId: 42,
    status: "approved",
    type: "هوية المالك",
  }, {}));

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { umami: { track: () => { throw new Error("analytics unavailable"); } } },
  });
  assert.doesNotThrow(() => trackPropertyVerificationDecision({
    propertyId: 42,
    status: "approved",
    type: "هوية المالك",
  }, {}));
});
