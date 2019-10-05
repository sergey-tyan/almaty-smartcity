const express = require('express');
const bodyParser = require('body-parser');
const db = require('./queries');
const path = require('path');

const app = express();
const port = 3005;

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/items', db.getItems);

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
