app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    console.log('Données reçues:', req.body);  // Ajoute ceci pour vérifier les données envoyées
  
    if (username === 'robert_jonathan@hotmail.com' && password === 'Cuisine7') {
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });
  