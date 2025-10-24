import express from 'express';
import db from './db';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.get('/db-test', async (req, res) => {
  try {
    const result = await db.raw('SELECT NOW()');
    res.json({ 
      message: 'Database connected!', 
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Database connection failed', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await db('users').select('*');
    res.json(users);
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

