import { useMemo } from "react";
//import "../styles/SeatGrid.css";


function groupSeats(seats) {
  const categories = new Map();

  for (const seat of seats) {
    if (!categories.has(seat.category)) {
      categories.set(seat.category, {
        name: seat.category,
        price: Number(seat.price),
        rows: new Map(),
      });
    }
    const category = categories.get(seat.category);

    if (!category.rows.has(seat.rowName)) {
      category.rows.set(seat.rowName, {
        name: seat.rowName,
        rowNumber: seat.rowNumber,
        seats: [],
      });
    }
    category.rows.get(seat.rowName).seats.push(seat);
  }

  return [...categories.values()]
    .map((c) => ({
      ...c,
      rows: [...c.rows.values()].sort((a, b) => a.rowNumber - b.rowNumber),
    }))
    .sort((a, b) => a.rows[0].rowNumber - b.rows[0].rowNumber);
}

export default function SeatGrid({ seats, columns, selectedIds, onToggle }) {
  const categories = useMemo(() => groupSeats(seats), [seats]);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  return (
    <div className="hall">
      <div className="hall-scroll">
        <div className="hall-inner" style={{ "--cols": columns }}>
          {categories.map((category) => (
            <section key={category.name} className="category">
              <h4 className="category-title">
                ₹{category.price} {category.name}
              </h4>

              {category.rows.map((row) => (
                <div key={row.name} className="row">
                  <span className="row-label">{row.name}</span>

                  <div className="row-seats">
                    {row.seats.map((seat) => {
                      const unavailable = seat.status !== "AVAILABLE";
                      const isSelected = selected.has(seat.id);

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          style={{ gridColumn: seat.columnNumber }}
                          className={[
                            "seat",
                            unavailable ? seat.status.toLowerCase() : "",
                            isSelected ? "selected" : "",
                          ].join(" ")}
                          disabled={unavailable}
                          aria-label={`Row ${row.name}, seat ${seat.columnName}`}
                          aria-pressed={isSelected}
                          onClick={() => onToggle(seat)}
                        >
                          {seat.columnName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          ))}

          <div className="screen">
            <div className="screen-bar" />
            All eyes this way please
          </div>
        </div>
      </div>

      <div className="legend">
        <span><i className="swatch" /> Available</span>
        <span><i className="swatch selected" /> Selected</span>
        <span><i className="swatch sold" /> Sold</span>
      </div>
    </div>
  );
}