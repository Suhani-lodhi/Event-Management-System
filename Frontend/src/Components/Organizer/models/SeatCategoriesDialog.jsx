import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import {
  getSeatCategories,
  createSeatCategory,
  updateSeatCategory,
  deleteSeatCategory,
} from "../../../api/event";
import DeleteDialog from "./DeleteDialog";
import {
  emptyCategory,
  validateCategory,
  toCategoryPayload,
} from "../../../utils/seatCategoryHelpers";

const emptyForm = emptyCategory();


export default function SeatCategoriesDialog({ open, subVenue, onClose, onChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getSeatCategories(subVenue.id);
      setCategories(data.categories ?? []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && subVenue) {
      closeForm();
      load();
    }
  }, [open, subVenue?.id]);

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(c) {
    setEditingId(c.id);
    setForm({
      categoryName: c.categoryName ?? "",
      categoryDetail: c.categoryDetail ?? "",
      seatCount: c.seatCount ?? "",
    });
    setShowForm(true);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // only used for the red helper text under the seat count field
  const seatCountInvalid =
    form.seatCount === "" ||
    !Number.isInteger(Number(form.seatCount)) ||
    Number(form.seatCount) < 1;
  const formInvalid = Boolean(validateCategory(form));

  async function handleSave() {
    if (formInvalid) return;
    setSaving(true);
    const payload = toCategoryPayload(form);
    try {
      const res = editingId
        ? await updateSeatCategory(editingId, payload)
        : await createSeatCategory(subVenue.id, payload);
      if (res.success) {
        toast.success(editingId ? "Category updated successfully" : "Category added successfully");
        closeForm();
        await load();
        onChange?.();
      } else {
        toast.error(res.msg || "Something went wrong. Can't save category");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const id = deleteId;
    setDeleteId(null);
    try {
      const res = await deleteSeatCategory(id);
      if (res.success) {
        toast.success("Category deleted successfully");
        setCategories((prev) => prev.filter((c) => c.id !== id));
        onChange?.();
      } else {
        toast.error(res.msg || "Something went wrong. Can't delete category");
      }
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>
          Seat Categories{subVenue?.subVenueName ? ` - ${subVenue.subVenueName}` : ""}
        </DialogTitle>

        <DialogContent>
          {loading ? (
            <p>Loading categories...</p>
          ) : categories.length === 0 ? (
            <p>No categories added.</p>
          ) : (
            <div className="sc-list">
              {categories.map((c) => (
                <div className="sc-item" key={c.id}>
                  <div className="vd-elements">
                    <h4>{c.categoryName}</h4>
                    <div>
                      <FontAwesomeIcon icon={faEdit} className="icon" onClick={() => openEdit(c)} />
                      <FontAwesomeIcon icon={faTrash} className="icon" onClick={() => setDeleteId(c.id)} />
                    </div>
                  </div>
                  <p><strong>Seats:</strong> {c.seatCount}</p>
                  {c.categoryDetail && <p>{c.categoryDetail}</p>}
                </div>
              ))}
            </div>
          )}

          {showForm && (
            <div className="sc-form">
              <h4>{editingId ? "Edit Category" : "Add Category"}</h4>
              <TextField
                margin="dense" fullWidth required
                label="Category Name (e.g. VIP)"
                name="categoryName"
                value={form.categoryName}
                onChange={handleChange}
              />
              <TextField
                margin="dense" fullWidth multiline minRows={2}
                label="Details (optional)"
                name="categoryDetail"
                value={form.categoryDetail}
                onChange={handleChange}
              />
              <TextField
                margin="dense" fullWidth required type="number"
                label="Seat Count"
                name="seatCount"
                value={form.seatCount}
                onChange={handleChange}
                error={form.seatCount !== "" && seatCountInvalid}
                helperText={form.seatCount !== "" && seatCountInvalid ? "Whole number, 1 or more" : ""}
                slotProps={{ htmlInput: { min: 1 } }}
              />
              <div className="sc-form-actions">
                <Button onClick={closeForm} disabled={saving}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving || formInvalid}>
                  {saving ? "Saving..." : editingId ? "Save" : "Add Category"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>

        <DialogActions>
          {!showForm && <Button onClick={openAdd}>Add +</Button>}
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <DeleteDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}