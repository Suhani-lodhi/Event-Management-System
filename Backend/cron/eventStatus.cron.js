import cron from 'node-cron';
import { updateEventAndSessionStatuses } from '../Sevices/eventStatus.service.js';
import { generateSessionSeats } from '../Sevices/User_Services/generateSessionSeats.js';

let isRunning = false;

export const startEventStatusCron = () =>{
    cron.schedule("* * * * *", async () =>{
        if (isRunning) return;

        isRunning = true;

        try{
            console.log("event status cron started");
            await updateEventAndSessionStatuses();
            console.log("Event status cron completed");

            const created = await generateSessionSeats();        
            if (created > 0) console.log(`Created ${created} session seats`);

        }
        catch(err){
            console.error("event status cron failed:", err);
        }
        finally{
            isRunning = false;
        }
    });

    console.log("Event status cron scheduled successfully");
}