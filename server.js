const express = require('express'); // Importer Express
const app = express(); // Initialiser l'application Express

// Middleware pour parser les requêtes JSON
app.use(express.json());

// Route POST pour le login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Logique de vérification ou d'authentification
  if (username === 'robert_jonathan@hotmail.com' && password === 'Cuisine7') {
    res.status(200).json({ message: 'Login successful' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Démarrer le serveur sur un port donné
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
