import axios from 'axios';
import * as cheerio from 'cheerio';

async function auth(username, password) {
  try {
    const loginUrl = 'https://planning.autocontrole.be/';
    const instance = axios.create({
      baseURL: loginUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        Referer: loginUrl,
      },
      withCredentials: true,
      maxRedirects: 0,
      validateStatus: (status) => status <= 302,
    });
    let cookies = [];
    const loginPage = await instance.get('/login.aspx');
    const $ = cheerio.load(loginPage.data);
    const loginResponse = await instance.post(
      '/login.aspx',
      new URLSearchParams({
        __EVENTTARGET: '',
        __EVENTARGUMENT: '',
        __VIEWSTATE: $('input[name="__VIEWSTATE"]').val(),
        __VIEWSTATEGENERATOR: $('input[name="__VIEWSTATEGENERATOR"]').val(),
        __EVENTVALIDATION: $('input[name="__EVENTVALIDATION"]').val(),
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
    const loginCookies = (loginResponse.headers['set-cookie'] || []).map(cookie => cookie.split(';')[0]);

    cookies = cookies.concat(loginCookies);
    return (cookies);
  } catch (error) {
      console.error('Erreur :', error.message);
    throw error;
  }
}

async function getIds(cookies) {
  try {
    const resaURL = 'https://planning.autocontrole.be/Reservaties/ReservatieOverzicht.aspx';
    const resaPage = await axios.get(resaURL, 
      {
        headers: {
          Cookie: cookies.join('; '),
        },
      });
    let $ = cheerio.load(resaPage.data);
    const response = await axios.post(
      resaURL,
      new URLSearchParams({
        __EVENTTARGET: 'ctl00$MainContent$gvAutokeuring$ctl02$lbRebook',
        __EVENTARGUMENT: '',
        __VIEWSTATE: $('input[name="__VIEWSTATE"]').val(),
        __VIEWSTATEGENERATOR: $('input[name="__VIEWSTATEGENERATOR"]').val(),
        __EVENTVALIDATION: $('input[name="__EVENTVALIDATION"]').val(),
      }),
      {
        headers: {
          Cookie: cookies.join('; '), // Formatage correct des cookies
          'Content-Type': 'application/x-www-form-urlencoded',
          },  
      }
    );
    $ = cheerio.load(response.data);
    const formAction = $('form').attr('action');
    const urlParams = new URLSearchParams(formAction.split('?')[1]);
    const voertuigId = urlParams.get('VoertuigId');
    const klantId = urlParams.get('KlantId');
    const keuringsTypeId = urlParams.get('KeuringsTypeId');
    const oldReservationId = urlParams.get('oldReservationId');
    
    const ids = {
      voertuigId,
      klantId,
      keuringsTypeId,
      oldReservationId
  };
  return (ids);
  } catch (error) {
      console.error('Erreur lors de la récupération des réservations :', error.message);
    throw error;
  }
}

async function getHaren(cookies, ids) {
  try {
      const resaURL = 'https://planning.autocontrole.be/Reservaties/NieuwAutokeuringReservatie.aspx?';
      const resaPage = await axios.get(resaURL, {
        headers: {
          Cookie: cookies.join('; '),
        },
      });
      let $ = cheerio.load(resaPage.data);
      const rebookURL = resaURL + ids[0] + '&' + ids[1] + '&' + ids[2] + '&' + ids[3];
      const harenHTML = await axios.post(rebookURL,
        new URLSearchParams({
          __EVENTTARGET: 'ctl00$MainContent$rblStation$0',
          __EVENTARGUMENT: '',
          __VIEWSTATE: $('input[name="__VIEWSTATE"]').val(),
          __VIEWSTATEGENERATOR: $('input[name="__VIEWSTATEGENERATOR"]').val(),
          __EVENTVALIDATION: $('input[name="__EVENTVALIDATION"]').val(),
        }),
        {
          headers: {
            Cookie: cookies.join('; '),
          },
        }
      );
      $ = cheerio.load(harenHTML);

// Créer un tableau pour stocker les résultats
      const results = [];
      // Sélectionner tous les éléments span avec l'ID
      $('span[id="ctl00_MainContent_rblTijdstip2"]').each((index, element) => {
          const span = $(element); // Convertir l'élément courant en objet Cheerio
          const date = span.attr('title'); // Récupérer l'attribut title
          const time = span.find('label').text(); // Récupérer le texte du label
          // Ajouter un objet au tableau des résultats
          results.push({ date, time });
      });
      return (results);
  }
  catch (error) {
    console.error('Erreur lors de la récupération des réservations :', error.message);
  throw error;
  }
}

export { auth, getIds, getHaren };
