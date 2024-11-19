const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Middleware pour parser les requêtes JSON

// Route GET pour la racine
app.get('/', (req, res) => {
  res.send('Hello, backend is running!');
});

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

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
