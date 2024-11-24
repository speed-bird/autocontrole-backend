const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

const corsOptions = {
  methods: ['GET', 'POST'], // Définir les méthodes autorisées
  allowedHeaders: ['Content-Type', 'Authorization'], // Définir les en-têtes autorisés
};
app.use(cors(corsOptions));

// Votre route ici
app.post('/login', (req, res) => {
  // Logique de votre route
  res.send('Login successfullllll');
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
