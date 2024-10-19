import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Telegraf } from 'telegraf';
import crypto from 'crypto';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import https from 'https';
import fs from 'fs';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Voeg deze regels toe aan het begin van je server.js bestand
console.log('Starting server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);
console.log('Telegram Bot Token:', process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'Not set');

const app = express();
const port = process.env.PORT || 3003;

app.use(helmet());
const allowedOrigins = ['https://ref.toshilabs.io', 'http://localhost:5173'];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api', limiter);

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.catch((err) => {
  console.error('Telegraf error', err);
});

const authRequests = new Map();

// SQLite setup
let db;

// Wijzig de initializeDatabase functie als volgt:
async function initializeDatabase() {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      auth_key TEXT UNIQUE,
      solana_address TEXT
    );
    CREATE TABLE IF NOT EXISTS invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      invitation_link TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      allow_invites BOOLEAN,
      required_referrals INTEGER
    );
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interval_value INTEGER,
      interval_unit TEXT,
      message TEXT,
      action TEXT
    );
  `);
  
  try {
    // Check if 'degencalls' user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE auth_key = ?', ['degencalls']);
    if (!existingUser) {
      // If 'degencalls' user doesn't exist, insert it
      await db.run('INSERT INTO users (auth_key) VALUES (?)', ['degencalls']);
      console.log('Added new user with auth_key degencalls');
    } else {
      console.log('User with auth_key degencalls already exists');
    }

    // Check and add settings if they don't exist
    const settings = await db.get('SELECT * FROM settings LIMIT 1');
    if (!settings) {
      await db.run('INSERT INTO settings (allow_invites, required_referrals) VALUES (?, ?)', [false, 1]);
      console.log('Added default settings');
    }
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Functie om de API-toegankelijkheid te controleren
async function checkApiAccessibility() {
  try {
    const response = await axios.get(`http://localhost:${port}/api/test`);
    if (response.data.message === 'API is working') {
      console.log('API is accessible and working correctly.');
    } else {
      console.error('API response is unexpected:', response.data);
    }
  } catch (error) {
    console.error('Error accessing API:', error.message);
  }
}

// Functie om de databaseverbinding te controleren
async function checkDatabaseConnection() {
  try {
    await db.get('SELECT 1');
    console.log('Database connection is successful.');
  } catch (error) {
    console.error('Error connecting to database:', error.message);
  }
}

// Functie om de Telegram bot-verbinding te controleren
async function checkTelegramBotConnection() {
  try {
    const botInfo = await bot.telegram.getMe();
    console.log('Telegram bot is connected:', botInfo.username);
  } catch (error) {
    console.error('Error connecting to Telegram bot:', error.message);
  }
}

// Hoofdfunctie om alle controles uit te voeren
async function runServerChecks() {
  console.log('Running server checks...');
  await checkDatabaseConnection();
  await checkTelegramBotConnection();
  
  // Wacht even voordat we de API controleren, zodat de server tijd heeft om op te starten
  setTimeout(async () => {
    await checkApiAccessibility();
    console.log('All checks completed.');
  }, 2000);
}

app.post('/api/telegram-auth', async (req, res) => {
  const { authKey } = req.body;
  console.log('Received auth request for key:', authKey);

  try {
    const user = await db.get('SELECT * FROM users WHERE auth_key = ?', ['degencalls']);
    if (!user || authKey !== 'degencalls') {
      console.log('Invalid auth key:', authKey);
      return res.status(400).json({ message: 'Invalid authentication key' });
    }

    const authCode = crypto.randomBytes(16).toString('hex');
    const chatId = '1800338145'; // Nieuwe user ID voor authenticatie

    console.log('Sending Telegram message...');
    await bot.telegram.sendMessage(chatId, 
      `New login attempt:\nAuth Key: ${authKey}\nAuth Code: ${authCode}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Accept', callback_data: `accept_${authCode}` },
              { text: 'Reject', callback_data: `reject_${authCode}` }
            ]
          ]
        }
      }
    );
    console.log('Telegram message sent successfully');

    authRequests.set(authCode, { status: 'pending', authKey });
    setTimeout(() => {
      if (authRequests.get(authCode)?.status === 'pending') {
        authRequests.delete(authCode);
      }
    }, 300000); // 5 minuten vervaltijd

    res.json({ authCode });
  } catch (error) {
    console.error('Error in telegram-auth:', error);
    res.status(500).json({ message: 'Error during authentication process', error: error.message });
  }
});

app.get('/api/check-auth/:authCode', (req, res) => {
  const { authCode } = req.params;
  const authRequest = authRequests.get(authCode);

  if (!authRequest) {
    return res.json({ status: 'expired' });
  }

  if (authRequest.status === 'accepted') {
    const token = crypto.randomBytes(32).toString('hex');
    authRequests.delete(authCode);
    return res.json({ status: 'accepted', token });
  }

  res.json({ status: authRequest.status });
});

app.get('/api/dashboard', async (req, res) => {
  const user = await db.get('SELECT * FROM users LIMIT 1');
  const invitation = await db.get('SELECT * FROM invitations WHERE user_id = ? LIMIT 1', [user.id]);
  
  // Deze waarden zijn placeholder. In een echte applicatie zou je deze uit de database halen.
  const invitedUsers = 150;
  const payingUsers = 75;
  const earnings = 1500;

  res.json({
    solanaAddress: user.solana_address || '',
    invitationLink: invitation ? invitation.invitation_link : '',
    invitedUsers,
    payingUsers,
    earnings
  });
});

app.post('/api/update-solana-address', async (req, res) => {
  const { solanaAddress } = req.body;
  await db.run('UPDATE users SET solana_address = ? WHERE id = 1', [solanaAddress]);
  res.json({ success: true });
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.get('SELECT * FROM settings LIMIT 1');
    const reminders = await db.all('SELECT * FROM reminders');
    console.log('Fetched settings:', settings);
    console.log('Fetched reminders:', reminders);
    res.json({
      allowInvites: settings.allow_invites === 1,
      requiredReferrals: settings.required_referrals,
      reminders: reminders.map(reminder => ({
        id: reminder.id,
        intervalValue: reminder.interval_value,
        intervalUnit: reminder.interval_unit,
        message: reminder.message,
        action: reminder.action
      }))
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  const { allowInvites, requiredReferrals, reminders } = req.body;
  try {
    if (allowInvites !== undefined) {
      await db.run('UPDATE settings SET allow_invites = ? WHERE id = 1', [allowInvites ? 1 : 0]);
    }
    if (requiredReferrals !== undefined) {
      await db.run('UPDATE settings SET required_referrals = ? WHERE id = 1', [requiredReferrals]);
    }
    if (reminders) {
      await db.run('DELETE FROM reminders');
      for (const reminder of reminders) {
        await db.run('INSERT INTO reminders (interval_value, interval_unit, message, action) VALUES (?, ?, ?, ?)',
          [reminder.intervalValue, reminder.intervalUnit, reminder.message, reminder.action]);
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ message: 'Error saving settings' });
  }
});

bot.on('callback_query', async (ctx) => {
  const [action, authCode] = ctx.callbackQuery.data.split('_');
  const authRequest = authRequests.get(authCode);

  if (!authRequest) {
    return ctx.answerCbQuery('This request has expired or is invalid.');
  }

  const currentTime = new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' });

  // Delete the original message
  await ctx.deleteMessage();

  let statusMessage = '';
  if (action === 'accept') {
    authRequests.set(authCode, { ...authRequest, status: 'accepted' });
    await ctx.answerCbQuery('Login accepted');
    statusMessage = 'Accepted';
  } else if (action === 'reject') {
    authRequests.set(authCode, { ...authRequest, status: 'rejected' });
    await ctx.answerCbQuery('Login rejected');
    statusMessage = 'Rejected';
  }

  // Send a new message without inline buttons
  await ctx.telegram.sendMessage(ctx.chat.id,
    `Login attempt:
Auth Key: ${authRequest.authKey}
Auth Code: ${authCode}
Status: ${statusMessage}
Time: ${currentTime}`
  );
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  console.log('Closing HTTP server.');
  server.close(() => {
    console.log('HTTP server closed.');
    db.close(() => {
      console.log('Database connection closed.');
      process.exit(0);
    });
  });
});

async function startServer() {
  try {
    await initializeDatabase();
    
    // API routes
    app.get('/api/test', (req, res) => {
      res.json({ message: 'API is working' });
    });

    app.post('/api/telegram-auth', async (req, res) => {
      // ... (bestaande code)
    });

    app.get('/api/check-auth/:authCode', (req, res) => {
      // ... (bestaande code)
    });

    app.get('/api/dashboard', async (req, res) => {
      // ... (bestaande code)
    });

    app.post('/api/update-solana-address', async (req, res) => {
      // ... (bestaande code)
    });

    app.get('/api/settings', async (req, res) => {
      // ... (bestaande code)
    });

    app.post('/api/settings', async (req, res) => {
      // ... (bestaande code)
    });

    // Logging middleware
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
      next();
    });

    // Statische bestandsserving (na API routes)
    app.use(express.static(path.join(__dirname, 'dist')));

    // Catch-all route (moet als laatste komen)
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });

    // HTTP server
    const server = http.createServer(app);
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
      runServerChecks();
    });

    // Start de Telegram bot
    bot.launch()
      .then(() => {
        console.log('Telegram bot successfully launched');
      })
      .catch((error) => {
        console.error('Error launching Telegram bot:', error);
      });

  } catch (error) {
    console.error('Error starting server:', error);
  }
}

startServer().catch(console.error);
