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
var proficiencyLevel;

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
    }).catch(error => console.log(error));

// Initial GET request to show home page
function showInitialPage() {
    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
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
        (async () => {
            let multiplier = Math.pow(1.366, (req.body.CR - 1));
            let hoard = Math.round(400 * multiplier);
            proficiencyLevel = Math.floor(req.body.CR / 4);
            let bundleDescriptions = await rollBundles(hoard);
            res.render('index.ejs', {bundles: bundleDescriptions}); // send all bundle descriptions to the html page
        })();
    });
}

async function rollBundles(hoard) { // returns an array of bundle descriptions in plain language
    let runningTotal = 0;
    let averageBundleSize = Math.round(hoard / 5);
    let bundleDescriptions = [];
    let fuzz = generateFuzzValue(averageBundleSize);
    let counter = 0;
    while (runningTotal < hoard) {
        let bundle = await rollDownTables('treasure');
        if (bundle.name == "magic items"){
            bundle.description = "Roll for level-appropriate magic items. Don't forget to have the monsters use them!";
            bundle.value = averageBundleSize * 2;
        } else {
            bundle = await generateQuantityAndValue(bundle, averageBundleSize, fuzz);
            bundle = await generateBundleDescription(bundle);
        }
        if (bundle.value < (hoard / 50) || bundle.value > (hoard / 2)) {
            bundleDescriptions.push(); // do nothing if out of reasonable range
        } else {
            bundleDescriptions.push(bundle.description);
            runningTotal += bundle.value;
            counter += 1;
        }
    }
    bundleDescriptions.push("The grand total is " + runningTotal + "gp"); // add final total as last item in array
    return bundleDescriptions;
}

function generateFuzzValue(averageBundleSize) { // make it so every bundle isn't the same amount
    fuzz = 10;
    for (let i = 1; i < averageBundleSize.toString().length - 2; i++){
    fuzz = fuzz * 10;
    }
    return fuzz;
}

function rollDownTables(table) { //recursively rolls randomly on subtables until it reaches a bottom-level bundle
    return new Promise((resolve, reject) => {
        treasureTypes.findOne({name: table}, (err, result) => {
            if (err) {
                resolve(err);
            } else if (result.subTable) {
                let nextTable = result.subTable[Math.floor(Math.random() * result.subTable.length)];
                resolve(rollDownTables(nextTable));
            } else {
                resolve(result);
            }
        });
    });
}

function generateQuantityAndValue(bundle, averageBundleSize, fuzz){
    if (Array.isArray(bundle.unitValue)) {bundle.unitValue = randBetween(bundle.unitValue[0], bundle.unitValue[1]);} //convert range to result
    if (Array.isArray(bundle.quantity)) {bundle.quantity = randBetween(bundle.quantity[0], bundle.quantity[1]);} //convert range to result
    bundle.value = Math.round(averageBundleSize * ((Math.random() + 0.5) / fuzz)) * fuzz * bundle.valueMultiplier; //roll for value, may be overridden later
    if (bundle.quantity && bundle.unitValue) { // items that have bounded plausible quantities and unitValues
        bundle.value = (bundle.quantity * bundle.unitValue);
        return bundle;
    } else if (!bundle.quantity) { // items that have bounded unitValues, but unbounded quantities - basically only coins
        bundle.quantity = Math.round(bundle.value / bundle.unitValue);
        return bundle;
    } else { // items that have unbounded value, but bounded quantity, like gems and art (the values scale to match the level of play, but it isn't plausible to find 100 paintings)
        return bundle;
    }
}

async function generateBundleDescription(bundle) { //turns an bundle object into a plain-English sentence
    let unit;
    let adjective = "";
    let container = "";
    let supplementalDescription = "";
    if (bundle.adjectives){adjective = bundle.adjectives[Math.floor(Math.random() * bundle.adjectives.length)];}
    if (bundle.unit) {unit = bundle.unit;} else {unit = "";}
    if (bundle.container) {container = await generateContainer(bundle.container);}
    if (bundle.art) {
        await generateArtDescription(bundle);
    }
    if (bundle.gem) {
        await generateGemDescription(bundle);
    }
    if (bundle.book) {
        await generateBookDescription(bundle);
    }
    if (bundle.jeweledItem) {
        await generateJeweledItemDescription(bundle);
    }
    if (bundle.supplementalDescription){supplementalDescription = bundle.supplementalDescription;}
    bundle.description = (container + bundle.quantity + " " + unit + " " + adjective + " " + bundle.name + supplementalDescription + " worth " + Math.round(bundle.value) + "gp. It all weighs " + Math.round(bundle.quantity * bundle.unitWeight) + " pounds. ");
    return bundle;
}

async function generateContainer(containerSize) {
    if (randBetween(1,4) == 1) { //chance of no container even if elligible
        return "";
    } else {
        let result = await rollDownTables((containerSize + " containers"));
        let adjective = result.adjectives[Math.floor(Math.random() * result.adjectives.length)];
        let trapDescription = "";
        let hidingSpotDescription = "";
        let lockDescription = "";
        if (containerSize == "small" && randBetween(1,5) == 1) {
            let hidingSpot = await rollDownTables('hiding spots');
            hidingSpotDescription = (" and " + hidingSpot.name + " (inv. DC" + generateDC() + ")");
        }
        if (result.name == "chest") {
            if (randBetween(1,5) == 1) {
                let trap = await rollDownTables('traps');
                trapDescription = ("It is trapped with " + trap.name + " (inv. DC" + generateDC() + ", disarm DC" + generateDC() + "). ");
            }
            if (randBetween(1,2) == 1) {
                lockDescription = ", locked (unlock DC " + generateDC() + ")";
            }
        } else {
            if (randBetween(1,20) == 1) {
                let trap = await rollDownTables('traps');
                trapDescription = ("It is trapped with " + trap.name + " (inv. DC" + generateDC() + ", disarm DC" + generateDC() + "). ");
            }
        }
        return ("A " + containerSize + lockDescription + ", " + adjective + " " + result.name + hidingSpotDescription + ". " + trapDescription + "Inside can be found ");
    }
}

function generateDC() {
    return randBetween(10,25) + proficiencyLevel;
}

function randBetween(x, y) { //random integer between x & y
    return ((Math.floor(Math.random() * (y - x))) + x);
}

function generateArtDescription(bundle) { //eventually, this will take a bundle and return a pluasible description for it
  bundle.supplementalDescription = "";
  return "OK";
}

function generateGemDescription(bundle) { //eventually, this will take a bundle and return a pluasible description for it
  bundle.supplementalDescription = "";
  return "OK";
}

function generateBookDescription(bundle) { //eventually, this will take a bundle and return a pluasible description for it
  bundle.supplementalDescription = "";
  return "OK";
}

function generateJeweledItemDescription(bundle) { //eventually, this will take a bundle and return a pluasible description for it
  bundle.supplementalDescription = ". It is set with jewels.";
  return "OK";
}
