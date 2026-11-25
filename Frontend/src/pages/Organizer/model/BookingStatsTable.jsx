import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";

const columns = [
  { field: "email", headerName: "Email", width: 180 },
  {
    field: "bookedAt",
    headerName: "Booked On",
    width: 180,
    type: "dateTime",
    valueGetter: (value) => (value ? new Date(value) : null),
    valueFormatter: (value) =>
      value
        ? value.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
  },
  {
    field: "totalTickets",
    headerName: "Total Tickets",
    type: "number",
    width: 110,
  },
  {
    field: "totalAmount",
    headerName: "Amount Paid",
    type: "number",
    width: 110,
    valueGetter: (value) => Number(value),
    valueFormatter: (value) =>
      value == null ? "" : `₹${value.toLocaleString("en-IN")}`,
  },
   {
    field: "ticketCancelled",
    headerName: "Cancelled Tickets",
    type: "number",
    width: 130,
  },
  {
    field: "refundedAmount",
    headerName: "Refund Paid",
    type: "number",
    width: 110,
    valueGetter: (value) => Number(value),
    valueFormatter: (value) =>
      value == null ? "" : `₹${value.toLocaleString("en-IN")}`,
  },
  {
    field: "status",
    headerName: "Booking Status",
    type: "string",
    width: 180
  }
];

const paginationModel = { page: 0, pageSize: 5 };

export default function BookingStatsTable({ bookingDetails }) {
    const navigate = useNavigate();
  return (
    <Paper sx={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={bookingDetails}
        columns={columns}
        getRowId={(row) => row.bookingId}
        initialState={{ pagination: { paginationModel } }}
        onRowClick={(params) =>   window.open(`/organizer/attendance/${params.row.bookingId}`, "_blank")}
        pageSizeOptions={[5, 10]}
        checkboxSelection
        sx={{ border: 0 }}
      />
    </Paper>
  );
}