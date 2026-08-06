import { createApp } from './app';
import { env } from './config/env';
import { startChangeRequestCron } from './jobs/changeRequestCron';

const app = createApp();

app.listen(env.port, () => {
  console.log(`Flowdesk API listening on port ${env.port}`);
});

startChangeRequestCron();
