import express from 'express';
import { auth, getIds, getHaren } from './auth.js';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: 'http://localhost:3000', // Remplacez par l'origine de votre front-end si nécessaire
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middlewares intégrés pour parser les données
app.use(express.json()); // Parse les requêtes JSON
app.use(express.urlencoded({ extended: true })); // Parse les requêtes URL-encoded

// Route POST pour effectuer le login
app.post('/login', async (req, res) => {
  const { username, password } = req.body; // Récupère les données envoyées dans le body de la requête

  if (!username || !password) {
    return res.status(400).json({ error: 'Username or password missing' });
  }
  try {
    const cookies = await auth(username, password); // Appelle la fonction login
    const ids = await getIds(cookies);
    console.log("IDS = "+ids);
    const haren = await getHaren(cookies, ids);
    console.log("Haren = "+haren);
    return res.status(200).json({ message: 'Login successful', haren });
  } catch (error) {
    console.error('Erreur lors de la connexion :', error.message);
    return res.status(500).json({ error: 'Login failed', details: error.message });
  }
});
// Lancer le serveur
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`);
});
