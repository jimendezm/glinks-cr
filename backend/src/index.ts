import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

// Note: When we deploy this to production, we need to specify in cors the allowed origins.
// Currently, any origin is allowed, which is somewhat insecure.
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
})
