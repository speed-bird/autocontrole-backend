import axios from 'axios';
import * as cheerio from 'cheerio';

async function auth(username, password) {
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
  try {
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

/*async function getClientID(cookies) {
  const resaURL = 'https://planning.autocontrole.be/Reservaties/ReservatieOverzicht.aspx';
  try {
    // Effectue la requête avec les cookies
    const resaPage = await axios.get(resaURL, {
      headers: {
        Cookie: cookies.join('; '), // Formatage correct des cookies
      },
    });
    
    
    const $ = cheerio.load(resaPage.data);
    const onClickValue = $('input[name="ctl00$MainContent$cmdReservatieAutokeuringAanmaken"]').attr('onclick');
    if (!onClickValue) {
      throw new Error('Attribut "onclick" introuvable dans la page HTML.');
    }
    const clientID = onClickValue.match(/KlantId=([\w-]+)/);
    if (!clientID || !clientID[1]) {
      throw new Error('"KlantId" introuvable dans l\'attribut "onclick".');
    }
    return clientID[1];
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations :', error.message);
    throw error;
  }
}
*/
async function getClientID(cookies) {
  const resaURL = 'https://planning.autocontrole.be/Reservaties/ReservatieOverzicht.aspx';
  try {
    // Effectue la requête avec les cookies
    const resaPage = await axios.get(resaURL, {
      headers: {
        Cookie: cookies.join('; '), // Formatage correct des cookies
      },
    });
    
    const $ = cheerio.load(resaPage.data);
    const postData = new URLSearchParams({
      __EVENTTARGET: 'ctl00$MainContent$gvAutokeuring$ctl02$lbRebook',
      __EVENTARGUMENT: '',
      __VIEWSTATE: $('input[name="__VIEWSTATE"]').val(),
      __VIEWSTATEGENERATOR: $('input[name="__VIEWSTATEGENERATOR"]').val(),
      __EVENTVALIDATION: $('input[name="__EVENTVALIDATION"]').val(),
    });
    // Faire une requête POST
    const response = await axios.post('https://planning.autocontrole.be/Reservaties/ReservatieOverzicht.aspx', postData, {
      headers: {
        Cookie: cookies.join('; '), // Formatage correct des cookies
        'Content-Type': 'application/x-www-form-urlencoded',
      },  
    });
    const location = response.headers['location'];
    console.log('URL de redirection :', location);
    return location;

    /*const onClickValue = $('input[name="ctl00$MainContent$cmdReservatieAutokeuringAanmaken"]').attr('onclick');
    if (!onClickValue) {
      throw new Error('Attribut "onclick" introuvable dans la page HTML.');
    }
    const clientID = onClickValue.match(/KlantId=([\w-]+)/);
    if (!clientID || !clientID[1]) {
      throw new Error('"KlantId" introuvable dans l\'attribut "onclick".');
    }
    return clientID[1];
    */
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations :', error.message);
    throw error;
  }
}

export { auth, getClientID };