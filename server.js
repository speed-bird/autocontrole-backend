// backend (Express)
const express = require('express');
const app = express();

app.get('/message', (req, res) => {
  res.json({ message: 'Bonjour du backend!' });
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
