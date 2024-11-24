const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

// Configurer CORS
const corsOptions = {
  origin: 'http://localhost:3000', // Permet uniquement les requêtes de localhost:3000
  methods: ['GET', 'POST'], // Définir les méthodes autorisées
  allowedHeaders: ['Content-Type', 'Authorization'], // Définir les en-têtes autorisés
};

// Utilisation de CORS avec la configuration
app.use(cors(corsOptions));

// Votre route ici
app.post('/login', (req, res) => {
  // Logique de votre route
  res.send('Login successful');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
