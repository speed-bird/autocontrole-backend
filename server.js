const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;
const login = require('./auth'); // Import de la fonction login

const corsOptions = {
  methods: ['GET', 'POST'], // Définir les méthodes autorisées
  allowedHeaders: ['Content-Type', 'Authorization'], // Définir les en-têtes autorisés
};
app.use(cors(corsOptions));
app.use(express.json());

app.post('/login', async (req, res) => {
  const { username, password } = req.body; 
  console.log('Username:', username);
  console.log('Password:', password);
  const cookies = await login(username, password);
  res.send(cookies);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
