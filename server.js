import express from 'express';  // Utilisation de 'import'
import bodyParser from 'body-parser'; // Utilisation de 'import'
import login from './auth.js'; // Utilisation de 'import', n'oubliez pas l'extension .js

const app = express();
app.use(bodyParser.json()); // Parse les requêtes JSON
app.use(bodyParser.urlencoded({ extended: true })); // Parse les requêtes URL-encoded

// Route POST pour effectuer le login
app.post('/login', async (req, res) => {
  const { username, password } = req.body; // Récupère les données envoyées dans le body de la requête

  if (!username || !password) {
    return res.status(400).json({ error: 'Username or password missing' });
  }

  try {
    const cookies = await login(username, password); // Appelle la fonction login
    return res.status(200).json({ message: 'Login successful', cookies });
  } catch (error) {
    console.error('Erreur lors de la connexion :', error.message);
    return res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Lancer le serveur
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
