import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

await connectDatabase();
createApp().listen(env.port, () => console.log(`RAILVISTA backend listening on ${env.port}`));
