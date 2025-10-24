import express from 'express';
import db from './db';
import { extractScopes, requireScope, AuthRequest } from './middleware/auth';
import logger, { loggerMiddleware } from './utils/logger';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(extractScopes);
app.use(loggerMiddleware(logger));

app.get('/users', requireScope('users:read:all'), async (req: AuthRequest, res) => {
  try {
    logger.info('Fetching all users');
    const users = await db('users').select('*');
    logger.info(`Retrieved ${users.length} users`);
    res.json(users);
  } catch (error) {
    logger.error('Error fetching all users', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/users/:id', requireScope('users:read'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching user with ID: ${id}`);
    const user = await db('users').where({ id }).first();
    
    if (!user) {
      logger.warn(`User not found with ID: ${id}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    logger.info(`User found: ${user.name} (${user.email})`);
    res.json(user);
  } catch (error) {
    logger.error('Error fetching user by ID', { 
      id: req.params.id, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    logger.info('Creating new user', { name, email });
    const [user] = await db('users').insert({ name, email }).returning('*');
    logger.info(`User created successfully with ID: ${user.id}`);
    res.status(201).json(user);
  } catch (error) {
    logger.error('Error creating user', { 
      name: req.body.name, 
      email: req.body.email,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});

