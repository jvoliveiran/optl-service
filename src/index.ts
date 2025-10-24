import express from 'express';
import db from './db';
import { extractScopes, requireScope, AuthRequest } from './middleware/auth';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(extractScopes);

app.get('/users', requireScope('users:read:all'), async (req: AuthRequest, res) => {
  try {
    const users = await db('users').select('*');
    res.json(users);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/users/:id', requireScope('users:read'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = await db('users').where({ id }).first();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    const [user] = await db('users').insert({ name, email }).returning('*');
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

