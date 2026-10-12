import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

export default function EditSubVenueDialog({ open, subVenue, onClose, onSave }) {
  const [form, setForm] = useState({
    subVenueName: "",
    categoryCount: "",
    capacity: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!subVenue) return;
    setForm({
      subVenueName: subVenue.subVenueName ?? "",
      categoryCount: subVenue.categoryCount ?? "",
      capacity: subVenue.capacity ?? "",
    });
  }, [subVenue]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const categoryInvalid =
    form.categoryCount === "" || Number(form.categoryCount) < 0;

  async function handleSave() {
    if (categoryInvalid) return;
    setSaving(true);
    await onSave(subVenue.id, {
      subVenueName: form.subVenueName.trim() || null,
      categoryCount: Number(form.categoryCount),
      capacity: form.capacity === "" ? null : Number(form.capacity),
    });
    setSaving(false);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Edit Sub-Venue</DialogTitle>

      <DialogContent>
        <TextField
          margin="dense"
          fullWidth
          label="Sub-Venue Name"
          name="subVenueName"
          value={form.subVenueName}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          fullWidth
          required
          type="number"
          label="Category Count"
          name="categoryCount"
          value={form.categoryCount}
          onChange={handleChange}
          error={categoryInvalid}
          helperText={categoryInvalid ? "Enter a valid number" : ""}
          slotProps={{ htmlInput: { min: 0 } }}
        />
        <TextField
          margin="dense"
          fullWidth
          type="number"
          label="Capacity (optional)"
          name="capacity"
          value={form.capacity}
          onChange={handleChange}
          slotProps={{ htmlInput: { min: 0 } }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || categoryInvalid}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}