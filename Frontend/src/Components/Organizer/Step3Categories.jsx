import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import "../Organizer/styles/Step1EventForm.css";
import {
  getEventDetails,
  getSeatCategories,
  getSessionPricing,
  saveSessionPricing,
} from "../../api/event";
import {
  emptyPriceRow,
  validatePricingRows,
  toPricingPayload,
  sumSeatsForSale,
} from "../../utils/pricinghelpers.jsx"

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : "";

export default function Step3Pricing({ eventId, step }) {
  const [sessions, setSessions] = useState([]);
  const [categoriesBySubVenue, setCategoriesBySubVenue] = useState({});
  const [rowsBySession, setRowsBySession] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  // load sessions, their sub-venue categories and any saved pricing
  // whenever the user lands on step 3
  useEffect(() => {
    if (step !== 3 || !eventId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await getEventDetails(eventId);
        const list = (data.event?.sessions ?? []).filter((s) => s.subVenueId);
        const subVenueIds = [...new Set(list.map((s) => s.subVenueId))];

        const [categoryResults, pricingResults] = await Promise.all([
          Promise.all(subVenueIds.map((id) => getSeatCategories(id))),
          Promise.all(list.map((s) => getSessionPricing(s.id))),
        ]);
        if (cancelled) return;

        const cats = {};
        subVenueIds.forEach((id, i) => {
          cats[id] = categoryResults[i].categories ?? [];
        });

        const rows = {};
        list.forEach((s, i) => {
          rows[s.id] = (pricingResults[i].categories ?? []).map((p) => ({
            seatCategoryId: String(p.seatCategoryId),
            alias: p.alias ?? "",
            price: p.price ?? "",
            seatsForSale: p.seatsForSale ?? "",
          }));
        });

        setSessions(list);
        setCategoriesBySubVenue(cats);
        setRowsBySession(rows);
      } catch (err) {
        if (!cancelled) toast.error(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [step, eventId]);

  // ---- row handlers ----

  const updateRows = (sessionId, fn) =>
    setRowsBySession((prev) => ({ ...prev, [sessionId]: fn(prev[sessionId] ?? []) }));

  const addRow = (sessionId) =>
    updateRows(sessionId, (rows) => [...rows, emptyPriceRow()]);

  const removeRow = (sessionId, index) =>
    updateRows(sessionId, (rows) => rows.filter((_, i) => i !== index));

  const changeRow = (sessionId, index, e, categories) => {
    const { name, value } = e.target;
    updateRows(sessionId, (rows) =>
      rows.map((r, i) => {
        if (i !== index) return r;
        const next = { ...r, [name]: value };
        // picking a category pre-fills seats with the full category,
        // the organizer can then lower it
        if (name === "seatCategoryId") {
          const cat = categories.find((c) => String(c.id) === value);
          next.seatsForSale = cat ? cat.seatCount : "";
        }
        return next;
      })
    );
  };

  async function handleSave(session, categories) {
    const rows = rowsBySession[session.id] ?? [];
    const error = validatePricingRows(rows, categories);
    if (error) {
      toast.error(error);
      return;
    }

    setSavingId(session.id);
    try {
      const res = await saveSessionPricing(session.id, toPricingPayload(rows));
      if (res.success) {
        toast.success("Pricing saved successfully");
      } else {
        toast.error(res.msg || "Something went wrong. Can't save pricing");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingId(null);
    }
  }

  // ---- render ----

  if (!eventId) return <p>Create the event and its sessions first.</p>;
  if (loading) return <p>Loading sessions...</p>;

  return (
    <div className="ce-form-page">
      <div className="ce-form-header">
        <h1>Set Pricing</h1>
        <p>
          Choose which seat categories each session sells, give them a name
          for buyers, a price, and how many seats to open for booking.
        </p>
      </div>

      {sessions.length === 0 && <p>No sessions found for this event.</p>}

      {sessions.map((session, index) => {
        const categories = categoriesBySubVenue[session.subVenueId] ?? [];
        const rows = rowsBySession[session.id] ?? [];
        const subVenueName = session.subVenue?.subVenueName;

        return (
          <div className="ce-card" key={session.id}>
            <div className="ce-card-header ce-session-card-header">
              <label>
                Session {index + 1}
                {session.startDateTime && ` - ${formatDateTime(session.startDateTime)}`}
                {subVenueName && ` - ${subVenueName}`}
              </label>
              <button
                type="button"
                onClick={() => addRow(session.id)}
                disabled={rows.length >= categories.length}
              >
                Add Category +
              </button>
            </div>

            {categories.length === 0 && (
              <p className="sc-summary">
                This sub-venue has no seat categories yet. Add them from My
                Venues first.
              </p>
            )}

            {categories.length > 0 && (
              <p className="sc-summary">
                <strong>Categories on sale:</strong> {rows.length} of {categories.length}
                {" | "}
                <strong>Seats on sale:</strong> {rows.length ? sumSeatsForSale(rows, categories) : "-"}
              </p>
            )}

            {rows.map((row, rowIndex) => {
              const selected = categories.find(
                (c) => String(c.id) === String(row.seatCategoryId)
              );
              // a category already used in another row can't be picked again
              const takenElsewhere = new Set(
                rows
                  .filter((_, i) => i !== rowIndex)
                  .map((r) => String(r.seatCategoryId))
              );

              return (
                <div className="sc-add-row" key={`${session.id}-${rowIndex}`}>
                  <div className="sc-add-head">
                    <strong>{selected ? selected.categoryName : `Category ${rowIndex + 1}`}</strong>
                    <FontAwesomeIcon
                      icon={faTrash}
                      className="icon"
                      onClick={() => removeRow(session.id, rowIndex)}
                    />
                  </div>

                  <div className="sc-add-fields">
                    <div className="ce-field-plain">
                      <label htmlFor={`cat-${session.id}-${rowIndex}`}>Seat Category</label>
                      <select
                        id={`cat-${session.id}-${rowIndex}`}
                        name="seatCategoryId"
                        value={row.seatCategoryId}
                        onChange={(e) => changeRow(session.id, rowIndex, e, categories)}
                      >
                        <option value="" disabled>Select category</option>
                        {categories
                          .filter((c) => !takenElsewhere.has(String(c.id)))
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.categoryName} ({c.seatCount} seats)
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="ce-field-plain">
                      <label htmlFor={`alias-${session.id}-${rowIndex}`}>Alias (optional)</label>
                      <input
                        id={`alias-${session.id}-${rowIndex}`}
                        name="alias"
                        value={row.alias}
                        placeholder="e.g. Front Row"
                        onChange={(e) => changeRow(session.id, rowIndex, e, categories)}
                      />
                    </div>

                    <div className="ce-field-plain">
                      <label htmlFor={`price-${session.id}-${rowIndex}`}>Price</label>
                      <input
                        id={`price-${session.id}-${rowIndex}`}
                        name="price"
                        type="number"
                        min="0"
                        step="any"
                        value={row.price}
                        placeholder="Price per seat"
                        onChange={(e) => changeRow(session.id, rowIndex, e, categories)}
                      />
                    </div>

                    <div className="ce-field-plain">
                      <label htmlFor={`seats-${session.id}-${rowIndex}`}>
                        Seats for booking{selected ? ` (max ${selected.seatCount})` : ""}
                      </label>
                      <input
                        id={`seats-${session.id}-${rowIndex}`}
                        name="seatsForSale"
                        type="number"
                        min="1"
                        max={selected ? selected.seatCount : undefined}
                        step="1"
                        value={row.seatsForSale}
                        placeholder="Seats to sell"
                        disabled={!selected}
                        onChange={(e) => changeRow(session.id, rowIndex, e, categories)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <br />
            <button
              type="button"
              onClick={() => handleSave(session, categories)}
              disabled={savingId === session.id || categories.length === 0}
            >
              {savingId === session.id ? "Saving..." : "Save Pricing"}
            </button>
          </div>
        );
      })}
    </div>
  );
}