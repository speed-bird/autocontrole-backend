const axios = require('axios');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json()); // Middleware pour parser les requêtes JSON
app.use(cors());

// Fonction pour effectuer le login via Axios
const loginToPlanningSite = async (username, password) => {
  try {
    // Soumettre les identifiants au formulaire de login via Axios
    const response = await axios.post('https://planning.autocontrole.be/login.aspx', {
      txtUser: username,    // Identifiant
      txtPassWord: password // Mot de passe
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      maxRedirects: 0 // Ne pas suivre les redirections, nous voulons gérer la redirection nous-mêmes
    });

    // Vérifiez la réponse et les headers pour voir si la connexion a réussi
    if (response.status === 200 && response.data.includes('ReservatieOverzicht.aspx')) {
      console.log('Login successful, redirected to reservation page');
      return true; // Connexion réussie
    } else {
      console.log('Login failed');
      return false; // Connexion échouée
    }
  } catch (error) {
    console.error('Error during login:', error.message);
    return false;
  }
};

// Route POST pour le login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, password });

  const loginSuccessful = await loginToPlanningSite(username, password);

  if (loginSuccessful) {
    res.status(200).json({ message: 'Login successful and redirected to reservation page' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
