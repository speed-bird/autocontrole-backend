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

async function getSlots(cookies, ids) {

  const reservationUrl =
  'https://planning.autocontrole.be/Reservaties/NieuwAutokeuringReservatie.aspx?VoertuigId=16e825e6-e99c-41d2-8461-4e1460dc080b&KlantId=9b495d05-bbf7-4c4d-8bc9-bdb2941f5ef2&KeuringsTypeId=4fefac0f-e376-4c11-815b-59a137c3c88b';
  const reservationPage = await axios.get(reservationUrl, { headers: { Cookie: cookies.join('; ') } });
  let $ = cheerio.load(reservationPage.data);
  const viewStateReservation = $('input[name="__VIEWSTATE"]').val();
  const viewStateGeneratorReservation = $('input[name="__VIEWSTATEGENERATOR"]').val();
  const eventValidationReservation = $('input[name="__EVENTVALIDATION"]').val();
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
  const slots = [];
  for (const station of stations) {
    console.log(`\n--- Vérification pour la station : ${station.name} ---`);

    const reservationResponse = await axios.post(
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
    const $ = cheerio.load(pageHTML);
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
      const tijdstipSpan = $(`#${tijdstipId}`);
      if (tijdstipSpan.length) {
        const date = tijdstipSpan.attr('title') || 'Date inconnue';
        const times = tijdstipSpan.text().trim().split(/(?=\d{2}:\d{2})/);
        
        times.forEach(time => {
          if (time) {
            slots.push({name: station.name, date, time});
          }
        });
      }
    }
  };
  console.log(`\n--- Vérifications terminées ---`);
  console.log("Slots = ", slots);
  return (slots);
  
}

export { auth, getMain, getBookings, reBookIds, getSlots };
