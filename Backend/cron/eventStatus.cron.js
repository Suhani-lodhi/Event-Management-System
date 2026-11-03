import cron from 'node-cron';
import { updateEventAndSessionStatuses } from '../Sevices/eventStatus.service.js';

let isRunning = false;

export const startEventStatusCron = () =>{
    cron.schedule("* * * * *", async () =>{
        if (isRunning) return;

        isRunning = true;

        try{
            console.log("event status cron started");
            await updateEventAndSessionStatuses();
            console.log("Event status cron completed");
        }
        catch(err){
            console.error("event status cron failed:", err);
        }
        finally{
            isRunning = false;
        }
    });

    console.log("Event status cron scheduled successfully")
}