const axios = require('axios');
const cheerio = require('cheerio');

async function login(username, password) {
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

module.exports = login;  // Utilisation de 'module.exports' pour l'export
