import { markAttendanceService } from "../../Sevices/Organizer_Services/attendence.service.js";

export const markAttendance = async (req, res) =>{
    try{
        const {bookingId} = req.params;
        const userId =req.user.id;

        const result = await markAttendanceService(bookingId, userId);

        res.status(200).json({
            success: true,
            ...result
        })
    }
    catch(err){
       res.status(err.statusCode || 500).json({
      message: err.statusCode ? err.message : "Something went wrong",
    });
    }
}