const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

const loginUrl = 'https://planning.autocontrole.be/';
const reservationUrl = 'https://planning.autocontrole.be/Reservaties/NieuwAutokeuringReservatie.aspx';

const instance = axios.create({
  baseURL: 'https://planning.autocontrole.be',
  headers: {
    'User-Agent': 'Mozilla/5.0',
    Referer: loginUrl,
  },
  withCredentials: true,
  validateStatus: (status) => status <= 302,
});

let cookies = [];

async function loginAndFetch(login, password, onProgress) {
  try {
    onProgress('Chargement de la page de connexion...');
    const loginPage = await instance.get('/Login.aspx');
    const $ = cheerio.load(loginPage.data);

    const viewState = $('input[name="__VIEWSTATE"]').val();
    const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val();
    const eventValidation = $('input[name="__EVENTVALIDATION"]').val();

    onProgress('Soumission du formulaire de connexion...');
    const loginResponse = await instance.post(
      '/Login.aspx',
      new URLSearchParams({
        __VIEWSTATE: viewState,
        __VIEWSTATEGENERATOR: viewStateGenerator,
        __EVENTVALIDATION: eventValidation,
        txtUser: login,
        txtPassWord: password,
        btnLogin: 'Se connecter',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    cookies = cookies.concat(loginResponse.headers['set-cookie'] || []);
    onProgress('Connexion réussie. Chargement des réservations...');

    const stations = [
      { name: 'Schaerbeek', target: 'ctl00$MainContent$rblStation$0' },
      { name: 'Haren', target: 'ctl00$MainContent$rblStation$1' },
    ];

    const results = [];
    for (const station of stations) {
      onProgress(`Vérification des réservations pour : ${station.name}`);
      const reservationResponse = await instance.post(
        reservationUrl,
        {
          __EVENTTARGET: station.target,
          __VIEWSTATE: viewState,
          __VIEWSTATEGENERATOR: viewStateGenerator,
          __EVENTVALIDATION: eventValidation,
        },
        {
          headers: { Cookie: cookies.join('; ') },
        }
      );

      results.push({ station: station.name, html: reservationResponse.data });
    }

    onProgress('Toutes les réservations ont été récupérées.');
    return results;
  } catch (error) {
    onProgress('Erreur lors de la récupération des données.');
    throw error;
  }
}

app.post('/fetch-reservations', async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ message: 'Login et mot de passe requis.' });
  }

  const progressUpdates = [];
  const onProgress = (message) => {
    progressUpdates.push(message);
    res.write(JSON.stringify({ progress: message }) + '\n'); // Envoi en temps réel
  };

  res.writeHead(200, { 'Content-Type': 'application/json' });

  try {
    const data = await loginAndFetch(login, password, onProgress);
    res.write(JSON.stringify({ success: true, data }) + '\n');
  } catch (error) {
    res.write(JSON.stringify({ success: false, error: error.message }) + '\n');
  } finally {
    res.end(); // Fin du streaming
  }
});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
