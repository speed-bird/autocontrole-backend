import axios from 'axios';
import * as cheerio from 'cheerio';
import { getCurrentMonday, getNextMondayDate, getTodayFormatted } from './misc.js';

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

async function getIds(cookies) {
  try {
    const resaUrl = 'https://planning.autocontrole.be/Reservaties/ReservatieOverzicht.aspx';
    const resaPage = await axios.get(resaUrl, { headers: { Cookie: cookies.join('; ') } });
    let $ = cheerio.load(resaPage.data);
    const response = await axios.post(
      resaUrl,
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

  const resaUrl = 'https://planning.autocontrole.be/Reservaties/NieuwAutokeuringReservatie.aspx?VoertuigId='+ids.voertuigId+'&KlantId='+ids.klantId+'&KeuringsTypeId='+ids.keuringsTypeId+'&oldReservationId='+ids.oldReservationId;
  const resaPage = await axios.get(resaUrl, { headers: { Cookie: cookies.join('; ') } });
  let $ = cheerio.load(resaPage.data);
  const viewStateResa = "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";
  const viewStateGeneratorResa = "EA9205FB";
  const eventValidationResa = "/wEdAAfB71l+OEE9mjfU8Hl4UeRap806u0vdaytaLP2vqUH14CzTekcWV6CnBvKLcr4anphKMeKFbvkaiHyGlW5YAjexr8zVnV9dMEgHh0CvhCF7TW1u3kHZcOe4AZ6salm7TogF3MI3ATSF/cwi0P/TLWbojnomJLLJM4pojpa+yRtDDG0A96tJJ/lblmTdmUI1kcI=";
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
  const slots = {};
  const pages = {};
  let page = "page";
  for (const station of stations) {
    console.log(`\n--- Vérification pour la station : ${station.name} ---`);
    if (!slots[station.name]) {
      slots[station.name] = []; // Initialisez un tableau vide si nécessaire
    }
    const params = new URLSearchParams({
      __EVENTTARGET: station.target,
      __EVENTARGUMENT: '',
      __VIEWSTATE: viewStateResa,
      __VIEWSTATEGENERATOR: viewStateGeneratorResa,
      __EVENTVALIDATION: eventValidationResa,
      ctl00$MainContent$rblStation: station.id,
    }); 
    let resaResponse = await axios.post(resaUrl, params, { headers: { Cookie: cookies.join('; ') } });
    let pageHTML = resaResponse.data;
    let $ = cheerio.load(pageHTML);
    const tijdstipIds = [
      'ctl00_MainContent_rblTijdstip1',
      'ctl00_MainContent_rblTijdstip2',
      'ctl00_MainContent_rblTijdstip3',
      'ctl00_MainContent_rblTijdstip4',
      'ctl00_MainContent_rblTijdstip5',
      'ctl00_MainContent_rblTijdstip6',
      'ctl00_MainContent_rblTijdstip7',
    ];
    tijdstipIds.forEach((tijdstipId) => {
      const tijdstipSpan = $(`#${tijdstipId}`);
      if (tijdstipSpan.length) {
        const date = tijdstipSpan.attr('title') || 'Date inconnue';
        const times = tijdstipSpan.text().trim().split(/(?=\d{2}:\d{2})/);
        times.forEach((time) => {
          if (time) {
            slots[station.name].push({ date, time });
          }
        });
      }
    });
    pages.pageREF = pageHTML;

    let date = getNextMondayDate(getCurrentMonday());
    const maxAttempts = 3;
    let attempts = 0;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    while (attempts < maxAttempts) {
      console.log("Date de l'attempt " + attempts + " = " + date);
      console.log(`Tentative ${attempts + 1} pour la station ${station.name}`);
    
      resaResponse = await axios.post(
        resaUrl,
        new URLSearchParams({
          __EVENTTARGET: $('#ctl00_MainContent_lbDatumVolgende').attr('id'),
          __EVENTARGUMENT: '',
          __VIEWSTATE: $('input[name="__VIEWSTATE"]').val(),
          __VIEWSTATEGENERATOR: $('input[name="__VIEWSTATEGENERATOR"]').val(),
          __EVENTVALIDATION: $('input[name="__EVENTVALIDATION"]').val(),
          ctl00$MainContent$lbSelectWeek: date,
        }),
        { headers: { Cookie: cookies.join('; ') } }
      );
    
      date = getNextMondayDate(date);
      pageHTML = resaResponse.data;
      pages[page + (attempts + 1)] = pageHTML;
      $ = cheerio.load(pageHTML);
    
      tijdstipIds.forEach((tijdstipId) => {
        const tijdstipSpan = $(`#${tijdstipId}`);
        if (tijdstipSpan.length) {
          const date = tijdstipSpan.attr('title') || 'Date inconnue';
          const times = tijdstipSpan.text().trim().split(/(?=\d{2}:\d{2})/);
    
          times.forEach((time) => {
            if (time) {
              const exists = slots[station.name].some(
                (slot) => slot.date === date && slot.time === time.trim()
              );
    
              if (!exists) {
                slots[station.name].push({ date, time: time.trim() });
              }
            }
          });
        }
      });
    
      if ($('#ctl00_MainContent_lblSituatieConfiguratieOngeldig').text().trim() !== '') {
        console.log('Texte trouvé dans le span, arrêt des vérifications.');
        break;
      }
    
      await delay(2000);
      attempts++;
    }
    
    if (attempts === maxAttempts) {
      console.log("Nombre maximum de tentatives atteint.");
    }
    
  }

  //return (pages);
  return slots;
}

export { auth, getMain, getBookings, getIds, getSlots };
