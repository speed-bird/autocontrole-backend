import "./login.js"
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'], // Définir les méthodes autorisées
  allowedHeaders: ['Content-Type', 'Authorization'], // Définir les en-têtes autorisés
};
app.use(cors(corsOptions));
app.use(express.json());

app.post('/login', (req, res) => {
  const { username, password } = req.body; 
  console.log('Username:', username);
  console.log('Password:', password);
  res.send(login(username, password));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
