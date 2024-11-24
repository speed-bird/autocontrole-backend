const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

const corsOptions = {
  methods: ['GET', 'POST'], // Définir les méthodes autorisées
  allowedHeaders: ['Content-Type', 'Authorization'], // Définir les en-têtes autorisés
};
app.use(cors(corsOptions));
app.use(express.json());

app.post('/login', (req, res) => {
  const { login, password } = req.body; 
  console.log('Login:', login);
  console.log('Password:', password);
  res.send('Login successful');
 
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
