import express from 'express';
import { auth, getMain, getBookings, reBookIds, getSlots } from './auth.js';
import cors from 'cors';

const app = express();

app.use(cors({
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username or password missing' });
  }
  try {
    const cookies = await auth(username, password);
    const main = await getMain(cookies);
    const bookings = getBookings(main);
    return res.status(200).json({ bookings, cookies });
  } 
  catch (error) {
    console.error('Erreur lors de la connexion :', error.message);
    return res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

app.post('/find-slots', async (req, res) => {
  const { selectedReservation, cookies } = req.body;
  try {
    console.log("Reservation selected = " + selectedReservation);
    const ids = await reBookIds(cookies);
    const slots = await getSlots(cookies, ids);
    res.json({ slots: slots });
  }
  catch (error) {
    console.error('Erreur lors de la connexion :', error.message);
    return res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

app.post('/save-data', async (req, res) => {
  const { value } = req.body; // la valeur envoyée depuis le front-end
  try {
    // Enregistrer la donnée dans la base de données
    await DataModel.create({ value });
    res.status(200).send('Data saved successfully');
  } catch (error) {
    res.status(500).send('Error saving data');
  }
});

app.get('/get-data', async (req, res) => {
  try {
    const data = await DataModel.findOne(); // Récupérer la dernière valeur
    res.status(200).json(data); // Envoyer la donnée au front-end
  } catch (error) {
    res.status(500).send('Error fetching data');
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`);
});
