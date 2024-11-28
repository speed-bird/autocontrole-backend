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

async function getMain(cookies) {
  const mainURL = 'https://planning.autocontrole.be/Reservaties/ReservatieOverzicht.aspx';
    const mainPage = await axios.get( mainURL, { headers: { Cookie: cookies.join('; ') } });
    return (mainPage);
}

function getBookings (mainPage) {
  const bookings = [];
  let $ = cheerio.load(mainPage.data);
  $('a[id*="lbRebook"]').each((index, element) => {
    bookings.push(
      { date: $(element).closest("tr").find("td:nth-child(3)").text().trim(),
        time: $(element).closest("tr").find("td:nth-child(4)").text().trim(),
        location: $(element).closest("tr").find("td:nth-child(5)").text().trim(),
        plate: $(element).closest("tr").find("td:nth-child(6)").text().trim(),
        model: $(element).closest("tr").find("td:nth-child(7)").text().trim()
    })}
  );
  return (bookings);
}

async function reBookIds(cookies) {
  try {
    console.log("cookies dans rebookIDs = ", cookies);
    const resaURL = 'https://planning.autocontrole.be/Reservaties/ReservatieOverzicht.aspx';
    const resaPage = await axios.get(resaURL, { headers: { Cookie: cookies.join('; ') } });
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
      { headers: { Cookie: cookies.join('; '), 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    $ = cheerio.load(response.data);
   // console.log("HTML = ", response.data);
    const formAction = $('form').attr('action');
    console.log("Form actioon = ", formAction);
    const urlParams = new URLSearchParams(formAction.split('?')[1]);
    console.log(typeof formAction); // Devrait afficher "string"
    const queryString = formAction.split('?')[1];
    console.log("Query string après split :", queryString);    
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
      const headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,nl;q=0.6,de;q=0.5',
        'Cache-Control': 'max-age=0',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies.join('; '),
        'Origin': 'https://planning.autocontrole.be',
        'Referer': 'https://planning.autocontrole.be/Reservaties/NieuwAutokeuringReservatie.aspx?VoertuigId=40c46927-155a-4ba2-8969-b701f903b784&KlantId=9b495d05-bbf7-4c4d-8bc9-bdb2941f5ef2&KeuringsTypeId=4fefac0f-e376-4c11-815b-59a137c3c88b&oldReservationId=a36d460c-7ae3-4393-96f8-c08251a4c26f',
        'Sec-CH-UA': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      };
      const resaURL = 'https://planning.autocontrole.be/Reservaties/NieuwAutokeuringReservatie.aspx?';
      const resaPage = await axios.get(resaURL, { headers: headers });
      let $ = cheerio.load(resaPage.data);

      // Étape 2 : Extraire les valeurs nécessaires pour la requête POST
      const __VIEWSTATE = $('input[name="__VIEWSTATE"]').val();
      const __VIEWSTATEGENERATOR = $('input[name="__VIEWSTATEGENERATOR"]').val();
      const __EVENTVALIDATION = $('input[name="__EVENTVALIDATION"]').val();

      // Étape 3 : Construire les données à envoyer dans la requête POST
      const postData = new URLSearchParams({
        __EVENTTARGET: 'ctl00$MainContent$rblStation$0',
        __EVENTARGUMENT: '',
        __VIEWSTATE,  
        __VIEWSTATEGENERATOR,
        __EVENTVALIDATION,
        ctl00$MainContent$rblStation: 'FABB7EFC-F207-4043-A39D-40F24D800C93',
        VoertuigId: '40c46927-155a-4ba2-8969-b701f903b784',
        KlantId: '9b495d05-bbf7-4c4d-8bc9-bdb2941f5ef2',
        KeuringsTypeId: '4fefac0f-e376-4c11-815b-59a137c3c88b'
      });

      // Étape 4 : Effectuer la requête POST
      const rebookURL = 'https://planning.autocontrole.be/Reservaties/NieuwAutokeuringReservatie.aspx?';
      const harenHTML = await axios.post(rebookURL, postData, { headers: headers });
      $ = cheerio.load(harenHTML.data);
      return(harenHTML);
      const results = [];
      $('span[id="ctl00_MainContent_rblTijdstip2"]').each((index, element) => {
          const span = $(element);
          const date = span.attr('title'); 
          const time = span.find('label').text(); 
          results.push({ date, time });
      });
      console.log("Results = ", results);
      return (results);
  }
  catch (error) {
    console.error('Erreur lors de la récupération des réservations :', error.message);
  throw error;
  }
}

export { auth, getMain, getBookings, reBookIds, getHaren };
