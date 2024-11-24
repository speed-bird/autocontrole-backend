const express = require('express');
const cors = require('cors');
const app = express();

// Autoriser les requêtes venant de localhost:3000
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
}));

app.post('/your-endpoint', (req, res) => {
  // Logique de traitement de la requête
  res.json({ message: 'Réponse du backend' });
});

app.listen(3001, () => {
  console.log('Backend running on port 3001');
});
