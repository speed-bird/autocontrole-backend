import axios from 'axios';
import * as cheerio from 'cheerio';

async function auth(username, password) {
  try {
    const loginUrl = 'https://planning.autocontrole.be/';
    const instance = axios.create({
      baseURL: 'https://planning.autocontrole.be',
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
    const viewState = $('input[name="__VIEWSTATE"]').val();
    const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val();
    const eventValidation = $('input[name="__EVENTVALIDATION"]').val();

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
    const loginCookies = loginResponse.headers['set-cookie'] || [];
    cookies = cookies.concat(loginCookies);
    return cookies;
  } catch (error) {
      console.error('Erreur :', error.message);
    throw error;
  }
}

async function resas(cookies) {
  const resaURL = 'https://planning.autocontrole.be/Reservaties/ReservatieOverzicht.aspx';
  try {
    const resaPage = await axios.get(resaURL, {
      headers: {
        Cookie: cookies.join('; '),
      },
    });
  } catch (error) {
      console.error('Erreur :', error.message);
    throw error;
  }
}

async function getIds(cookies) {
  try {
    const postData = new URLSearchParams({
      __EVENTTARGET: 'ctl00$MainContent$gvAutokeuring$ctl02$lbRebook',
      __EVENTARGUMENT: '',
      __VIEWSTATE: $('input[name="__VIEWSTATE"]').val(),
      __VIEWSTATEGENERATOR: $('input[name="__VIEWSTATEGENERATOR"]').val(),
      __EVENTVALIDATION: $('input[name="__EVENTVALIDATION"]').val(),
    });
    const response = await axios.post(
      'https://planning.autocontrole.be/Reservaties/ReservatieOverzicht.aspx', 
      postData, {
        headers: {
        Cookie: cookies.join('; '), // Formatage correct des cookies
        'Content-Type': 'application/x-www-form-urlencoded',
        },  
      }
    );
    const $$ = cheerio.load(response.data);
    const formAction = $$('form').attr('action');
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

export { auth, getIds };
