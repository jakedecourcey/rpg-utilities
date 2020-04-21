// server.js

// Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

// Mongo connections details
const connectionString = 'mongodb://192.168.50.5:27017';

// Define express server
const app = express ();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// Define global vars
var treasureTypes;
var bundleDescriptions = [];

// Establish server listening port
app.listen(3000, function(){
      console.log('listening on 3000');
});

// Establish Connection to MongoDB
MongoClient.connect(connectionString, { useUnifiedTopology: true
    }).then(client => {
        const treasureDB = client.db('treasure');
        treasureTypes = treasureDB.collection('treasure-types');
        showInitialPage();
        getTreasureResults();
        listAllTreasure();
    }).catch(error => console.log(error));

// Initial GET request to show home page
function showInitialPage() {
    app.get('/', (req, res) => {
        res.render('index.ejs', {bundles: bundleDescriptions});
    });
}

// Test POST request to insert treasure into collection
app.post('/addTreasure', (req, res) => {
    treasureTypes.insertOne(req.body)
        .then(result => {
            res.redirect('/');
        })
        .catch(error => { console.log(error); });
});

// Test POST request to retrieve all treasure
function listAllTreasure(){
    app.post('/listTreasure', (req, res) => {
        treasureTypes.find().toArray()
            .then(results => {
                console.log(results);
                res.redirect('/');
            })
            .catch(error => { console.log(error); });
    });
}

// POST request to retrieve treasure results
function getTreasureResults() {
    app.post('/getTreasure', (req, res) => {
        let bundleDescriptions = ["Stuff", "Other stuff"];
        res.render('index.ejs', {bundles: bundleDescriptions}); // send all bundle descriptions to the html page
    });
}
