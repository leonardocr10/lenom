import express from 'express';
import cors from 'cors';
import { join } from 'node:path';
import { UPLOAD_DIR } from './db.js';
import { router } from './routes.js';

const PORT = Number(process.env.PORT) || 3333;
const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1h' }));
app.use('/api', router);

// Em produção serve também o bundle do Angular.
const dist = join(import.meta.dirname, '..', 'dist', 'lenom-ai', 'browser');
app.use(express.static(dist, { index: false }));
app.get(/^(?!\/api|\/uploads).*/, (_req, res, next) => {
  res.sendFile(join(dist, 'index.html'), (err) => (err ? next() : undefined));
});

app.use((err, _req, res, _next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  const message =
    err.code === 'LIMIT_FILE_SIZE' ? 'Arquivo acima de 5 MB.' : err.message || 'Erro interno.';
  console.error('[api]', err);
  res.status(status).json({ error: message });
});

app.listen(PORT, () => console.log(`[api] http://localhost:${PORT}/api`));
