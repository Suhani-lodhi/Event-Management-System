import { useState } from "react";
import { toast } from "react-toastify";
import { updateEventStatus, updateRegistrationStatus } from "../../api/event.jsx";

export const EVENT_STATUS_OPTIONS = [
  { value: "DRAFTED", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ACTIVE", label: "Active" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const labelOf = (value) =>
  EVENT_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;

const CANCEL_ACTION = {
  to: "CANCELLED",
  label: "Cancel event",
  danger: true,
  confirm: "Cancel this event? This cannot be undone.",
};

const EVENT_ACTIONS = {
  DRAFTED: [
    { to: "PUBLISHED", label: "Publish", schedule: true },
  ],
  PUBLISHED: [{ label: "Set go-live time", schedule: true },{ to: "ACTIVE", label: "Activate now" }, CANCEL_ACTION],
  ACTIVE: [CANCEL_ACTION],
  CANCELLED: [],
  CLOSED: [],
};

const toLocalInput = (date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

const formatDateTime = (value) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const getErrorMessage = (err, fallback) =>
  err?.response?.data?.msg || err?.message || fallback;

export function EventStatusToggle({ eventId, status, activeAt, onChange }) {
  const [saving, setSaving] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [goLiveAt, setGoLiveAt] = useState("");

  const actions = EVENT_ACTIONS[status] ?? [];

  async function run(next, scheduledAt) {
  if (saving) return;
  setSaving(true);
  try {
    const res = await updateEventStatus(eventId, next, scheduledAt);
    if (res.success) {
      toast.success(
        scheduledAt
          ? `Event published. It goes live on ${formatDateTime(scheduledAt)}`
          : res.msg || `Event status changed to ${labelOf(next)}`
      );
      setShowSchedule(false);
      setGoLiveAt("");
      onChange?.(res.event?.status ?? next, res.event?.activeAt ?? scheduledAt ?? null);
    } else {
      toast.error(res.msg || "Something went wrong. Can't change event status");
    }
  } catch (err) {
    toast.error(getErrorMessage(err, "Can't change event status"));
  } finally {
    setSaving(false);
  }
}



  function handleAction(action) {
    if (action.schedule) {
      setShowSchedule((open) => !open);
      return;
    }
    if (action.confirm && !window.confirm(action.confirm)) return;
    run(action.to);
  }

  function confirmSchedule() {
    if (!goLiveAt) return;
    const when = new Date(goLiveAt);
    if (when <= new Date()) {
      toast.error("Pick a time in the future");
      return;
    }
    run("PUBLISHED", when.toISOString());
  }

  return (
    <div className="st-wrap">
      <div className="st-group" role="group" aria-label="Event status">
        {/* <span className={`st-badge st-${status.toLowerCase()}`}>
          {labelOf(status)}
        </span> */}

        {actions.map((a) => (
          <button
            key={a.to + a.label}
            type="button"
            className={`st-option${a.danger ? " st-danger" : ""}`}
            disabled={saving}
            onClick={() => handleAction(a)}
          >
            {a.label}
          </button>
        ))}
      </div>

      {status === "PUBLISHED" && activeAt && (
        <p className="st-note">Goes live on {formatDateTime(activeAt)}</p>
      )}

      {status === "CLOSED" && (
        <p className="st-note">This event has finished and was closed automatically.</p>
      )}

      {showSchedule && status === "DRAFTED" && (
        <div className="st-schedule">
          <label>
            Go live at
            <input
              type="datetime-local"
              value={goLiveAt}
              min={toLocalInput(new Date())}
              onChange={(e) => setGoLiveAt(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="st-option"
            disabled={saving || !goLiveAt}
            onClick={confirmSchedule}
          >
            Schedule
          </button>
        </div>
      )}
    </div>
  );
}

export function RegistrationSwitch({
  sessionId,
  status, 
  sessionStatus, 
  opensAt,
  onChange,
}) {
  const [saving, setSaving] = useState(false);
  const isOpen = status === "OPEN";
  const sessionInactive = Boolean(sessionStatus) && sessionStatus !== "ACTIVE";

  async function toggle() {
    if (saving || sessionInactive) return;
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
    }  catch (err) {
        toast.error(getErrorMessage(err, "Can't change registration"));
     }finally {
      setSaving(false);
    }
  }



  const text = isOpen
    ? "Registration open"
    : status === "SCHEDULED"
    ? opensAt
      ? `Opens on ${formatDateTime(opensAt)}`
      : "Registration scheduled"
    : "Registration closed";

  return (
    <label
      className="st-switch"
      title={sessionInactive ? "The session must be active to change registration" : undefined}
    >
      <input
        type="checkbox"
        checked={isOpen}
        disabled={saving || sessionInactive}
        onChange={toggle}
      />
      {/* <span className="st-slider" /> */}
      <span>{text}</span>
    </label>
  );
}