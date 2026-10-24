import { useState } from "react";
import { toast } from "react-toastify";
import { updateEventStatus, updateRegistrationStatus } from "../../api/event.jsx";

export const EVENT_STATUS_OPTIONS = [
  { value: "DRAFTED", label: "Draft" },
  { value: "COMING_SOON", label: "Up-coming" },
  { value: "ACTIVE", label: "Active" },
  { value: "CLOSED", label: "Closed" },
];

// Event status: Draft / Up-coming / Active / Closed.
// The UI only changes after the server accepts the change, so a rejected
// change (e.g. no priced session yet) never flickers.
export function EventStatusToggle({ eventId, status, onChange }) {
  const [saving, setSaving] = useState(false);

  async function select(next) {
    if (next === status || saving) return;
    setSaving(true);
    try {
      const res = await updateEventStatus(eventId, next);
      if (res.success) {
        const label = EVENT_STATUS_OPTIONS.find((o) => o.value === next)?.label;
        toast.success(`Event status changed to ${label}`);
        onChange?.(next);
      } else {
        toast.error(res.msg || "Something went wrong. Can't change event status");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="st-group" role="group" aria-label="Event status">
      {EVENT_STATUS_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`st-option${o.value === status ? " st-active" : ""}`}
          aria-pressed={o.value === status}
          disabled={saving}
          onClick={() => select(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Registration status of one session: OPEN / CLOSED switch.
export function RegistrationSwitch({ sessionId, status, onChange }) {
  const [saving, setSaving] = useState(false);
  const isOpen = status === "OPEN";

  async function toggle() {
    if (saving) return;
    const next = isOpen ? "CLOSED" : "OPEN";
    setSaving(true);
    try {
      const res = await updateRegistrationStatus(sessionId, next);
      if (res.success) {
        toast.success(next === "OPEN" ? "Registration opened" : "Registration closed");
        onChange?.(next);
      } else {
        toast.error(res.msg || "Something went wrong. Can't change registration");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <label className="st-switch">
      <input type="checkbox" checked={isOpen} disabled={saving} onChange={toggle} />
      <span className="st-slider" />
      <span>{isOpen ? "Registration open" : "Registration closed"}</span>
    </label>
  );
}