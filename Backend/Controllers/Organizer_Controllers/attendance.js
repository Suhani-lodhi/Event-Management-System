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
        console.log(err.message);
         return res.status(500).json({ msg: err.message, success: false , err: err});
    }
}