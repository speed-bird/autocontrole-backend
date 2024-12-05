function getNextMondayDate(dateInput) {
    // Obtenir la date actuelle
    let date = new Date(dateInput);
  
    // Calculer le nombre de jours jusqu'au lundi suivant
    let daysToAdd = (1 - date.getDay() + 7) % 7;
    if (daysToAdd === 0) daysToAdd = 7; // Si aujourd'hui est déjà lundi, on ajoute 7 jours pour obtenir le lundi suivant
  
    // Ajouter les jours nécessaires pour atteindre le lundi suivant
    date.setDate(date.getDate() + daysToAdd);
  
    // Formater la date en "dd/mm/yyyy"
    let day = date.getDate().toString().padStart(2, '0');
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let year = date.getFullYear();
  
    console.log(`${day}/${month}/${year}`);
    return `${day}/${month}/${year}`;
    
}

function getTodayFormatted() {
    let today = new Date();
    let day = today.getDate().toString().padStart(2, '0'); // Jour du mois (ajoute un zéro si nécessaire)
    let month = (today.getMonth() + 1).toString().padStart(2, '0'); // Mois (ajoute un zéro si nécessaire)
    let year = today.getFullYear(); // Année complète
  
    return `${day}/${month}/${year}`; // Format "dd/mm/yyyy"
  }
  
  let todayFormatted = getTodayFormatted();
  console.log(todayFormatted); // Affiche la date d'aujourd'hui au format "dd/mm/yyyy"
  

export { getNextMondayDate, getTodayFormatted };