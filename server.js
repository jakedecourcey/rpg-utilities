// server.js

const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

const connectionString = 'mongodb://192.168.50.5:27017';

const app = express ();

app.use(bodyParser.urlencoded({ extended: true }));

app.listen(3000, function(){
      console.log('listening on 3000');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/add', (req, res) => {
    console.log(req.body);
});

MongoClient.connect(connectionString, (err, client) => {
    if (err) return console.error(err);
    console.log('Connected to Database');
});
