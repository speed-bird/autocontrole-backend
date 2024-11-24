const axios = require('axios');
const cheerio = require('cheerio');

async function login(username, password) {
  const loginURL = 'https://planning.autocontrole.be/';
  const instance = axios.create({
    baseURL: loginURL,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      Referer: loginUrl,
    },
    withCredentials: true,
    maxRedirects: 0,
    validateStatus: (status) => status <= 302, // Gérer les redirections comme acceptables
  });

  let cookies = [];
  try {
    // Étape 1 : Charger la page de connexion
    const loginPage = await instance.get('/login.aspx');
    const $ = cheerio.load(loginPage.data);

    const viewState = $('input[name="__VIEWSTATE"]').val();
    const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val();
    const eventValidation = $('input[name="__EVENTVALIDATION"]').val();

    // Étape 2 : Soumettre le formulaire de connexion
    const loginResponse = await instance.post(
      '/login.aspx',
      new URLSearchParams({
        __EVENTTARGET: '',
        __EVENTARGUMENT: '',
        __VIEWSTATE: viewState,
        __VIEWSTATEGENERATOR: viewStateGenerator,
        __EVENTVALIDATION: eventValidation,
        txtUser: username,
        txtPassWord: password,
        btnLogin: 'Se connecter',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: loginUrl,
        },
      }
    );

    // Récupérer les cookies de la réponse
    const loginCookies = loginResponse.headers['set-cookie'] || [];
    cookies = cookies.concat(loginCookies);

    return cookies;

    /*
    // Étape 3 : Charger la page de réservation
    const reservationUrl =
  'https://planning.autocontrole.be/Reservaties/NieuwAutokeuringReservatie.aspx?'
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

    for (const station of stations) {
      console.log(`\n--- Vérification pour la station : ${station.name} ---`);

      const reservationResponse = await instance.post(
        reservationUrl,
        new URLSearchParams({
          __EVENTTARGET: station.target,
          __EVENTARGUMENT: '',
          __VIEWSTATE: viewStateReservation,
          __VIEWSTATEGENERATOR: viewStateGeneratorReservation,
          __EVENTVALIDATION: eventValidationReservation,
          VoertuigId: '16e825e6-e99c-41d2-8461-4e1460dc080b',
          KlantId: '9b495d05-bbf7-4c4d-8bc9-bdb2941f5ef2',
          KeuringsTypeId: '4fefac0f-e376-4c11-815b-59a137c3c88b',
          ctl00$MainContent$rblStation: station.id,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: cookies.join('; '),
            Referer: reservationUrl,
          },
        }
      );

      const pageHTML = reservationResponse.data;
      console.log(reservationResponse.data);

      // Charger la page avec Cheerio
      const $responsePage = cheerio.load(pageHTML);

      // Vérifier les balises <span> avec les IDs spécifiés
      const tijdstipIds = [
        'ctl00_MainContent_rblTijdstip1',
        'ctl00_MainContent_rblTijdstip2',
        'ctl00_MainContent_rblTijdstip3',
        'ctl00_MainContent_rblTijdstip4',
        'ctl00_MainContent_rblTijdstip5',
        'ctl00_MainContent_rblTijdstip6',
        'ctl00_MainContent_rblTijdstip7',
      ];

      for (const tijdstipId of tijdstipIds) {
        const tijdstipSpan = $responsePage(`#${tijdstipId}`);
        if (tijdstipSpan.length) {
          const titleAttr = tijdstipSpan.attr('title') || 'Date inconnue';
          const contentText = tijdstipSpan.text().trim();
          console.log(`${titleAttr} ${contentText}`);
        }
      }
    }
*/
  } catch (error) {
    console.error('Erreur :', error.message);
  }
}

module.exports = { login };
