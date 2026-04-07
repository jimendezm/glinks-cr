import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 3000;

// Note: When we deploy this to production, we need to specify in cors the allowed origins.
// Currently, any origin is allowed, which is somewhat insecure.
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.get('/plans', async (req, res) => {
  const data = await prisma.planCatalog.findMany();
  res.json({ data });
});

app.get('/sectors', async (req, res) => {
  const data = await prisma.sectorCatalog.findMany();
  res.json({ data });
});

app.get('/ap-types', async (req, res) => {
  const data = await prisma.apTypeCatalog.findMany();
  res.json({ data });
});

app.get('/roles', async (req, res) => {
  const data = await prisma.roleCatalog.findMany();
  res.json({ data });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
