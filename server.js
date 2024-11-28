import express from 'express';
import { auth, getMain, getBookings, reBookIds, getHaren } from './auth.js';
import cors from 'cors';

const app = express();
app.use(cors({
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route POST pour effectuer le login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username or password missing' });
  }
  try {
    let progress = 0;

    // Emitting progress
    const updateProgress = (step) => {
      res.write(`data: ${JSON.stringify({ progress: step })}\n\n`);
    };

    updateProgress(10); // Initializing progress
    const cookies = await auth(username, password);
    updateProgress(30); // After authentication
    const main = await getMain(cookies);
    updateProgress(50); // After getting main data
    const bookings = getBookings(main);
    updateProgress(70); // After getting bookings
    return res.status(200).json({ bookings, cookies, progress: 100 });
  } catch (error) {
    console.error('Erreur lors de la connexion :', error.message);
    return res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Route pour la recherche des créneaux
app.post('/find-slots', async (req, res) => {
  const { selectedReservation, cookies } = req.body;
  try {
    let progress = 0;
    const updateProgress = (step) => {
      res.write(`data: ${JSON.stringify({ progress: step })}\n\n`);
    };

    updateProgress(10); // Initial progress
    console.log("Reservation selected = " + selectedReservation);
    const ids = await reBookIds(cookies);
    updateProgress(50); // After retrieving IDs
    const haren = await getHaren(cookies, ids);
    updateProgress(90); // After getting slots
    res.json({ results: haren, progress: 100 });
  } catch (error) {
    console.error('Erreur lors de la connexion :', error.message);
    return res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
