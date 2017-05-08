const app = require('express')();
const mongoose = require('mongoose');
// var util = require('./util');

mongoose.Promise = global.Promise;

mongoose.connect('localhost/urlShortener');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('DB open');
});

var urlEntrySchema = mongoose.Schema({
    original: String,
    shortCode: {
        type: Number,
        index: true
    }
})

urlEntrySchema.index({
    shortCode: 1
});
urlEntrySchema.set('autoIndex', false);

var UrlEntry = mongoose.model('UrlEntry', urlEntrySchema);

app.set('view engine', 'pug');
app.set('views', './views');

app.get('/', (req, res) => {
    res.status(200).render('index', {
        title: 'URL Shortener Microservice',
        app: 'FreeCodeCamp API Basejump: URL Shortener Microservice',
        usage: 'User Stories',
        userStory1: 'I can pass a URL as a parameter and I will receive a shortened URL in the JSON response.',
        userStory2: 'When I visit that shortened URL, it will redirect me to my original link.',
        section1: 'Creation Example',
        content1: 'https://www.xyz.com/new/https://www.google.com',
        section2: 'Output Example',
        content2: '{"message":"Url successfully shortened","url":"http://www.xyz/2"}',
        section3: 'Usage Example',
        content3: 'https://www.xyz.com/2',
        section4: 'Will redirect to:',
        content4: 'http://www.google.com'
    });
});

app.get('/new/*', (req, res) => {
    let url = req.params[0];

    if (isValidUrl(url)) {
        isDuplicateUrl(url).then(shortCode => {      
            if (shortCode) {        
                res.status(200).json({          
                    error: 'URL already exists in the database.',
                              url: `http://www.example.com/${shortCode}`        
                });      
            } else {         // If it's not a duplicate, we insert a new document here.
                insertUrl(url).then(insertedDoc => {
                    if (!insertedDoc) {
                        res.status(500).json({
                            error: 'Unknown Error'
                        });
                    } else {
                        res.status(200).json({ message: 'Url successfully shortened', url: createFullUrl(req, insertedDoc.shortCode) });
                    }
                })      
            }    
        });
    } else {
        res.status(500).json({
            error: 'Invalid URL format.'
        })
    }

});

app.get('/:shortCode', (req, res) => {
    let shortCode = parseInt(req.params.shortCode);

    if (isNaN(shortCode)) {
        res.status(200).json({ error: 'Invalid URL shortcode, must be a number.' });
    } else {
        UrlEntry.findOne({ shortCode: shortCode }).then(doc => {
            if (!doc) {
                res.status(404).json({ error: 'Page not found.'});
            } else {
                res.redirect(doc.original);
            }
        })
    }
})

function isDuplicateUrl(url) {

    return UrlEntry    
    .findOne({ original: url })    
    .then(doc => { 
        //console.log(doc);
        return doc ? doc.shortCode : 0;    
    });
}

function isValidUrl(url) {   // Must comply to this format () means optional:
       // http(s)://(www.)domain.ext(/)(whatever follows)
      
    let regEx = /^https?:\/\/(\S+\.)?(\S+\.)(\S+)\S*/;  
    return regEx.test(url);
}

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

function insertUrl(url) {
    return getShortCode().then(newShortCode => {
        let newUrl = new UrlEntry({
            original: url,
            shortCode: newShortCode
        });
        return newUrl.save();
    })
}

function createFullUrl(req, url) {
  return `${req.protocol}://${req.hostname}:${getPort()}/${url}`;
}

function getPort() {
  return process.env.PORT || 3000;
}

module.exports = app;