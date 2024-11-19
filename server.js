const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Middleware pour parser les requêtes JSON

// Route GET pour la racine
app.get('/', (req, res) => {
  res.send('Hello, backend is running!');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    console.log('Login attempt:', { username, password }); // Log de la requête
  
    if (username === 'robert_jonathan@hotmail.com' && password === 'Cuisine7') {
      console.log('Login successful');
      res.status(200).json({ message: 'Login successful' });
    } else {
      console.log('Invalid credentials');
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });
  

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
