import { useState } from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import DeleteDialog from './DeleteDialog';

import { deleteSessionById, updateSessionById } from '../../../api/event';
import ConfirmCreateDialog from './ConfirmCreateDialog';
import { toast } from 'react-toastify';



const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'startDateTime', label: 'Start', minWidth: 200, format: formatDateTime, editType: 'datetime' },
  { id: 'endDateTime', label: 'End', minWidth: 200, format: formatDateTime, editType: 'datetime' },
  { id: 'regStartdateTime', label: 'Reg. Opens', minWidth: 200, format: formatDateTime, editType: 'datetime' },
  { id: 'regEndDateTime', label: 'Reg. Closes', minWidth: 200, format: formatDateTime, editType: 'datetime' },
  { id: 'venueId', label: 'Venue', minWidth: 120 },
  { id: 'subVenueId', label: 'Sub-Venue', minWidth: 120 },
  { id: 'registrationStatus', label: 'Registration', minWidth: 140 },
  { id: 'actions', label: 'Actions', minWidth: 170 },
];

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ISO string -> "YYYY-MM-DDTHH:mm" (local time), the format <input type="datetime-local"> needs
const pad = (n) => String(n).padStart(2, '0');
function toInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "YYYY-MM-DDTHH:mm" -> ISO string for the API
function toISO(value) {
  return value ? new Date(value).toISOString() : null;
}

const statusColor = {
  OPEN: 'success',
  CLOSED: 'error',
  UPCOMING: 'default',
};

export default function SessionsTable({ sessions = [] }) {
  const [Sessions, setSessions] = useState(sessions);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [sessionToEdit, setSessionToEdit] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  async function deleteSession(id) {
    const data = await deleteSessionById(id);
    if (data) {
      toast.success("Session deleted successfully.");
      setSessions((prev) => prev.filter((p) => p.id !== id));
    }
    else{
      toast.error("Something went wrong")
    }
  }

  function startEdit(session) {
    setEditingId(session.id);
    setDraft({
      startDateTime: toInputValue(session.startDateTime),
      endDateTime: toInputValue(session.endDateTime),
      regStartdateTime: toInputValue(session.regStartdateTime),
      regEndDateTime: toInputValue(session.regEndDateTime),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({});
  }

  const handleDraftChange = (field) => (e) =>
    setDraft((prev) => ({ ...prev, [field]: e.target.value }));

  async function saveEdit() {
    if (
      draft.startDateTime &&
      draft.endDateTime &&
      new Date(draft.endDateTime) <= new Date(draft.startDateTime)
    ) {
      toast.info("End time must be after start time")
      return;
    }

    const payload = {
      startDateTime: toISO(draft.startDateTime),
      endDateTime: toISO(draft.endDateTime),
      regStartdateTime: toISO(draft.regStartdateTime),
      regEndDateTime: toISO(draft.regEndDateTime)
    };

    const updated = await updateSessionById(editingId, payload);
    if (updated) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? { ...s, ...payload, ...(typeof updated === 'object' ? updated : {}) }
            : s
        )
      );
      toast.success("Session Updated Successfully.")
      cancelEdit();
    }
    else{
      toast.error("Something went wrong.")
    }
  }

  function renderEditor(column) {
    const common = {
      size: 'small',
      fullWidth: true,
      value: draft[column.id] ?? '',
      onChange: handleDraftChange(column.id),
    };

    if (column.editType === 'datetime') {
      return <TextField {...common} type="datetime-local" />;
    }
    if (column.editType === 'status') {
      return (
        <TextField {...common} select>
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
      );
    }
    return null;
  }

  function getRegistrationStatus(session) {
    const { regStartdateTime, regEndDateTime, registrationStatus } = session;

    // If dates are missing, fall back to whatever the backend sent
    if (!regStartdateTime || !regEndDateTime) return registrationStatus;

    const now = new Date();
    if (now < new Date(regStartdateTime)) return 'UPCOMING';
    if (now > new Date(regEndDateTime)) return 'CLOSED';
    return 'OPEN';
  }


  function handleDeleteClick(id) {
    setSessionToDelete(id);
    setDialogOpen(true);
  }

  function handleConfirmDelete() {
    setDialogOpen(false);
    deleteSession(sessionToDelete);
    setSessionToDelete(null);
  }

  function handleCloseDialog() {
    setDialogOpen(false);
    setSessionToDelete(null);
  }


  function handleEditClick(id) {
    setSessionToEdit(id);
    setEditDialogOpen(true);
  }
  function handleConfirmEdit() {
    setEditDialogOpen(false);
    saveEdit();
    setSessionToEdit(null);
  }
  function handleCloseEditDialog() {
    setEditDialogOpen(false);
    setSessionToEdit(null);
  }




  return (
    <>
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 4 }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sessions table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.id} style={{ minWidth: column.minWidth }}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    No sessions added yet
                  </TableCell>
                </TableRow>
              ) : (
                Sessions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(
                  (session, i) => {
                    const isEditing = editingId === session.id;

                    return (
                      <TableRow hover key={session.id}>
                        {columns.map((column) => {
                          if (column.id === 'index') {
                            return (
                              <TableCell key={column.id}>
                                {page * rowsPerPage + i + 1}
                              </TableCell>
                            );
                          }

                          // Edit mode: show an input for editable columns
                          if (isEditing && column.editType) {
                            return (
                              <TableCell key={column.id}>{renderEditor(column)}</TableCell>
                            );
                          }

                          if (column.id === 'registrationStatus') {
                            const status = getRegistrationStatus(session);
                            return (
                              <TableCell key={column.id}>
                                <Chip
                                  label={status}
                                  size="small"
                                  color={statusColor[status] || 'default'}
                                />
                              </TableCell>
                            );
                          }

                          if (column.id === 'venueId') {
                            return (
                              <TableCell key={column.id}>
                                {session.subVenue?.venue?.venueName || `#${session.venueId ?? '—'}`}
                              </TableCell>
                            );
                          }

                          if (column.id === 'subVenueId') {
                            return (
                              <TableCell key={column.id}>
                                {session.subVenue?.subVenueName || `#${session.subVenueId}`}
                              </TableCell>
                            );
                          }

                          if (column.id === 'actions') {
                            return (
                              <TableCell key={column.id}>
                                <Stack direction="row" spacing={1}>
                                  {isEditing ? (
                                    <>
                                      <Button size="small" variant="contained" onClick={handleEditClick}>
                                        Save
                                      </Button>
                                      <Button size="small" variant="outlined" onClick={cancelEdit}>
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => startEdit(session)}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        onClick={() => handleDeleteClick(session.id)}
                                      >
                                        Delete
                                      </Button>
                                    </>
                                  )}
                                </Stack>
                              </TableCell>
                            );
                          }

                          const value = session[column.id];
                          return (
                            <TableCell key={column.id}>
                              {column.format ? column.format(value) : value ?? '—'}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  }
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 15]}
          component="div"
          count={Sessions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <DeleteDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmCreateDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        onConfirm={handleConfirmEdit}
        isEdit= {true}
      />

    </>
  );
}