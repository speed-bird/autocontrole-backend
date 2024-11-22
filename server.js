const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config(); // Pour charger les variables d'environnement

const app = express();
console.log('Using port:', process.env.PORT); // Ajoute cette ligne pour vérifier le port utilisé

const port = process.env.PORT || 3001;
const cors = require('cors');
// Ajoutez ce middleware pour analyser les données JSON dans les requêtes
app.use(express.json()); // <-- Cette ligne est nécessaire !
app.use(cors());  // Cela autorise toutes les demandes CORS
app.use(express.json()); // Pour parser les données JSON dans le corps de la requête

const loginUrl = 'https://planning.autocontrole.be/';
const reservationUrl =
  'https://planning.autocontrole.be/Reservaties/NieuwAutokeuringReservatie.aspx?VoertuigId=16e825e6-e99c-41d2-8461-4e1460dc080b&KlantId=9b495d05-bbf7-4c4d-8bc9-bdb2941f5ef2&KeuringsTypeId=4fefac0f-e376-4c11-815b-59a137c3c88b&oldReservationId=e76e98f9-4bda-410d-9035-163e6c772a24';

const instance = axios.create({
  baseURL: 'https://planning.autocontrole.be',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    Referer: loginUrl,
  },
  withCredentials: true,
  maxRedirects: 0,
  validateStatus: function (status) {
    return status <= 302;
  },
});

let cookies = [];

async function loginAndFetch(login, password) {
  try {
    const messages = []; // Array to collect messages
    
    // Étape 1 : Charger la page de connexion
    const loginPage = await instance.get('/Login.aspx');
    const $ = cheerio.load(loginPage.data);

    const viewState = $('input[name="__VIEWSTATE"]').val();
    const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val();
    const eventValidation = $('input[name="__EVENTVALIDATION"]').val();

    // Étape 2 : Soumettre le formulaire de connexion avec les valeurs envoyées par le frontend
    const loginResponse = await instance.post(
      '/Login.aspx',
      new URLSearchParams({
        __EVENTTARGET: '',
        __EVENTARGUMENT: '',
        __VIEWSTATE: viewState,
        __VIEWSTATEGENERATOR: viewStateGenerator,
        __EVENTVALIDATION: eventValidation,
        txtUser: login, // Utilisation de la valeur envoyée par le frontend
        txtPassWord: password, // Utilisation de la valeur envoyée par le frontend
        btnLogin: 'Se connecter',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: loginUrl,
        },
      }
    );

    const loginCookies = loginResponse.headers['set-cookie'] || [];
    cookies = cookies.concat(loginCookies);

    // Étape 3 : Charger la page de réservation
    const reservationPage = await instance.get(reservationUrl, {
      headers: {
        Cookie: cookies.join('; '),
      },
    });

    const $reservation = cheerio.load(reservationPage.data);

    const viewStateReservation = $reservation('input[name="__VIEWSTATE"]').val();
    const viewStateGeneratorReservation = $reservation('input[name="__VIEWSTATEGENERATOR"]').val();
    const eventValidationReservation = $reservation('input[name="__EVENTVALIDATION"]').val();

    const stations = [
      {
        name: 'Schaerbeek',
        target: 'ctl00$MainContent$rblStation$0',
        id: 'FABB7EFC-F207-4043-A39D-40F24D800C93',
      },
      {
        name: 'Haren',
        target: 'ctl00$MainContent$rblStation$1',
        id: '289340F7-3DF5-43AD-AFB7-71E4A27FE94D',
      },
    ];

    let results = [];
    
    // Collecter les données de réservation
    for (const station of stations) {
      messages.push(`\n--- Vérification pour la station : ${station.name} ---`); // Ajouter le message ici

      const reservationResponse = await instance.post(
        reservationUrl,
        {
          __EVENTTARGET: station.target,
          __EVENTARGUMENT: '',
          __VIEWSTATE: viewStateReservation,
          __VIEWSTATEGENERATOR: viewStateGeneratorReservation,
          __EVENTVALIDATION: eventValidationReservation,
          VoertuigId: '16e825e6-e99c-41d2-8461-4e1460dc080b',
          KlantId: '9b495d05-bbf7-4c4d-8bc9-bdb2941f5ef2',
          KeuringsTypeId: '4fefac0f-e376-4c11-815b-59a137c3c88b',
          oldReservationId: 'e76e98f9-4bda-410d-9035-163e6c772a24',
          ctl00$MainContent$rblStation: station.id,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: cookies.join('; '),
            Referer: reservationUrl,
          },
        }
      );

      // Récupérer le HTML de la page de réservation
      const pageHTML = reservationResponse.data;

      // Renvoi du HTML complet dans la réponse
      results.push({ station: station.name, html: pageHTML });
    }

    return { messages, results }; // Retourner aussi les messages
  } catch (error) {
    console.error('Erreur dans la récupération des données:', error.response ? error.response.data : error.message);
    throw error;
  }
}


app.post('/fetch-reservations', async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
      return res.status(400).json({ message: 'Login et mot de passe requis.' });
  }

  try {
      const data = await loginAndFetch(login, password);
      res.json({ success: true, data });
  } catch (error) {
      res.status(500).json({ message: 'Erreur serveur : ' + error.message });
  }
});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
