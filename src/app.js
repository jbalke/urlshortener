const app = require('express')();
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('localhost/urlShortener');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Database opened.');
});

// { original: "http://www.google.com", shortCode: 1 }
var urlEntrySchema = mongoose.Schema({
    original: String,
    shortCode: {
        type: Number,
        index: true,
        unique: true
    }
})

//to prevent index creation on db startup
urlEntrySchema.set('autoIndex', false);

var UrlEntry = mongoose.model('UrlEntry', urlEntrySchema);

app.set('view engine', 'pug');
app.set('views', './views');

// Display Service How-To
app.get('/', (req, res) => {
    res.status(200).render('index', {
        title: 'URL Shortener Microservice',
        app: 'FreeCodeCamp API Basejump: URL Shortener Microservice',
        usage: 'User Stories',
        userStory1: 'I can pass a URL as a parameter and I will receive a shortened URL in the JSON response.',
        userStory2: 'When I visit that shortened URL, it will redirect me to my original link.',
        section1: 'Creation Example',
        content1: genFullUrl(req, "new/http://www.google.com"),
        section2: 'Output Example',
        content2: `{"message":"Url successfully shortened","url":"${genFullUrl(req, 2)}`,
        section3: 'Usage Example',
        content3: genFullUrl(req, 2),
        section4: 'Will redirect to:',
        content4: 'http://www.google.com'
    });
});

// Get URL and provide a shortcode
app.get('/new/*', (req, res) => {
    let url = req.params[0];

    // Check that URL is valid
    if (isValidUrl(url)) {
        // Check that URL is not already stored
        isDupUrl(url).then(shortCode => {      
            if (shortCode) {        
                res.status(200).json({          
                    error: 'URL already exists in the database.',
                              url: genFullUrl(req, shortCode)        
                });      
            } else {         
                // If it's not a duplicate, insert into db.
                insertUrl(url).then(insertedDoc => {
                    if (!insertedDoc) {
                        res.status(500).json({
                            error: 'Unknown Error'
                        });
                    } else {
                        res.status(200).json({
                            message: 'Url successfully shortened',
                            url: genFullUrl(req, insertedDoc.shortCode)
                        });
                    }
                })      
            }    
        });
    } else {
        // Provided URL is not valid.
        res.status(500).json({
            error: 'Invalid URL format.'
        })
    }

});

// Redirect to full URL matching provided shortcode.
app.get('/:shortCode', (req, res) => {
    let shortCode = parseInt(req.params.shortCode);

    if (isNaN(shortCode)) {
        res.status(200).json({
            error: 'Invalid URL shortcode, must be a number.'
        });
    } else {
        UrlEntry.findOne({
            shortCode: shortCode
        }).then(doc => {
            if (!doc) {
                res.status(404).json({
                    error: 'Entry not found.'
                });
            } else {
                res.redirect(doc.original);
            }
        })
    }
})

// Query for existing instance of a URL in the db.
function isDupUrl(url) {
    return UrlEntry    
        .findOne({
            original: url
        })    
        .then(doc => { 
            return doc ? doc.shortCode : 0;    
        });
}

function isValidUrl(url) {   // Must comply to this format () means optional:
    let regEx = /^https?:\/\/(\S+\.)?(\S+\.)(\S+)\S*/;  
    return regEx.test(url);
}

// Add URL and shortcode to db.
function insertUrl(url) {
    return getShortCode().then(newShortCode => {
        let newUrl = new UrlEntry({
            original: url,
            shortCode: newShortCode
        });
        return newUrl.save();
    })
}

// Query db for next shortCode in sequence.
function getShortCode() {
    return UrlEntry
        .find()
        .sort({
            shortCode: -1
        })
        .limit(1)
        .select({
            _id: 0,
            shortCode: 1
        })
        .then(doc => {
            return doc.length === 1 ? doc[0].shortCode + 1 : 1;
        })
}

// Generate a URL with current server hostname.
function genFullUrl(req, url) {  
    return `${req.protocol}://${req.hostname}:${getPort()}/${url}`;
}

// Get node.js port.
function getPort() {  
    return process.env.PORT || 3000;
}

module.exports = app;