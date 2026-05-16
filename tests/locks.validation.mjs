import assert from "node:assert/strict";

const twoHoursMs = 2 * 60 * 60 * 1000;
const reminderLeadMs = 15 * 60 * 1000;

function getMatchLockDate(startsAt) {
  return new Date(new Date(startsAt).getTime() - twoHoursMs);
}

function isPredictionEditable(lockAt, now) {
  return new Date(now) < new Date(lockAt);
}

function isInsidePickLockReminderWindow(lockAt, now) {
  const currentDate = new Date(now);
  const lockDate = new Date(lockAt);
  const windowEnd = new Date(currentDate.getTime() + reminderLeadMs);

  return lockDate > currentDate && lockDate <= windowEnd;
}

function runLockTests() {
  const startsAt = new Date("2026-06-11T20:00:00.000Z");
  const lockAt = getMatchLockDate(startsAt);

  assert.equal(lockAt.toISOString(), "2026-06-11T18:00:00.000Z");
  assert.equal(isPredictionEditable(lockAt, new Date("2026-06-11T17:59:59.999Z")), true);
  assert.equal(isPredictionEditable(lockAt, new Date("2026-06-11T18:00:00.000Z")), false);
  assert.equal(isPredictionEditable(lockAt, new Date("2026-06-11T18:00:00.001Z")), false);
}

function runReminderWindowTests() {
  const now = new Date("2026-06-11T17:45:00.000Z");

  assert.equal(isInsidePickLockReminderWindow(new Date("2026-06-11T17:45:00.000Z"), now), false);
  assert.equal(isInsidePickLockReminderWindow(new Date("2026-06-11T17:45:01.000Z"), now), true);
  assert.equal(isInsidePickLockReminderWindow(new Date("2026-06-11T18:00:00.000Z"), now), true);
  assert.equal(isInsidePickLockReminderWindow(new Date("2026-06-11T18:00:01.000Z"), now), false);
}

runLockTests();
runReminderWindowTests();

console.log("Lock and reminder rules validated.");
