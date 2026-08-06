import cron from 'node-cron';
import { applyDueChangeRequests } from '../services/scheduling';

export function startChangeRequestCron(): void {
  cron.schedule('* * * * *', async () => {
    const applied = await applyDueChangeRequests();
    if (applied.length > 0) {
      console.log(`Applied ${applied.length} scheduled change request(s).`);
    }
  });
}
