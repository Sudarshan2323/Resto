import express from 'express';
import cors from 'cors';
import { api } from './routes';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api', api);

async function start(preferredPorts: number[]) {
  for (const port of preferredPorts) {
    try {
      await new Promise<void>((resolve, reject) => {
        const srv = app.listen(port, () => {
          console.log(`RestoManager backend listening on http://localhost:${(srv.address() as any).port}`);
          resolve();
        });
        srv.on('error', (err: any) => {
          if (err && err.code === 'EADDRINUSE') {
            srv.close();
            reject(err);
          } else {
            reject(err);
          }
        });
      });
      return; // started successfully
    } catch (e) {
      continue; // try next port
    }
  }
  // last resort: random port
  app.listen(0, () => {
    const address = app.listen().address();
    // This line won't usually run; keeping minimal logging
    console.log('RestoManager backend started.');
  });
}

const envPort = process.env.PORT ? Number(process.env.PORT) : undefined;
const portsToTry = [envPort, 4000].filter((p): p is number => typeof p === 'number' && !Number.isNaN(p));
void start(portsToTry.length ? portsToTry : [4000]);
