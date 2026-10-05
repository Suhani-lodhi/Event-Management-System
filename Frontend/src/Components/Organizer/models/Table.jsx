import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import { deleteSessionById } from '../../../api/event';
import { faDisplay } from '@fortawesome/free-solid-svg-icons';

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'startDateTime', label: 'Start', minWidth: 150, format: formatDateTime },
  { id: 'endDateTime', label: 'End', minWidth: 150, format: formatDateTime },
  { id: 'regStartdateTime', label: 'Reg. Opens', minWidth: 150, format: formatDateTime },
  { id: 'regEndDateTime', label: 'Reg. Closes', minWidth: 150, format: formatDateTime },
  { id: 'venueId', label: 'Venue', minWidth: 120},
  { id: 'subVenueId', label: 'Sub-Venue', minWidth: 120 },
  { id: 'registrationStatus', label: 'Registration', minWidth: 130 },
  { id: 'actions', label: 'Actions' , minWidth: 120}
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

const statusColor = {
  OPEN: 'success',
  CLOSED: 'error',
  UPCOMING: 'default',
};



export default function SessionsTable({ sessions = [] }) {
  const [Sessions, setSessions] = React.useState(sessions? sessions : [])
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  async function deleteSession(id){
     const data = await deleteSessionById(id);
     if(data){
        alert("session deleted successfully");
        setSessions((prev) => prev.filter((p)=> p.id !== id));
     }
  }

  return (
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
              Sessions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((session, i) => (
                  <TableRow hover key={session.id}>
                    {columns.map((column) => {
                      if (column.id === 'index') {
                        return (
                          <TableCell key={column.id}>
                            {page * rowsPerPage + i + 1}
                          </TableCell>
                        );
                      }

                      if (column.id === 'registrationStatus') {
                        return (
                          <TableCell key={column.id}>
                            <Chip
                              label={session.registrationStatus}
                              size="small"
                              color={statusColor[session.registrationStatus] || 'default'}
                            />
                          </TableCell>
                        );
                      }

                      if (column.id === 'subVenueId') {
                        return (
                          <TableCell key={column.id}>
                            {session.subVenueName || `#${session.subVenueId}`}
                          </TableCell>
                        );
                      }

                      if(column.id === 'actions'){
                        return (
                            <TableCell key={column.id}>
                                <div style={{display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <button onClick={() => deleteSession(session.id)}>delete</button>
                                <button>Edit</button>
                                </div>
                            </TableCell>
                        )
                      }

                      const value = session[column.id];
                      return (
                        <TableCell key={column.id}>
                          {column.format ? column.format(value) : value ?? '—'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 15]}
        component="div"
        count={sessions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}