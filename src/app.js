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

app.get('/', (req, res) => {
    res.status(200).send('URL Shortener Microservice');
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
                        res.status(200).send(`URL successfully shortened: http://www.xyz.com/${insertedDoc.shortCode}`);
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

module.exports = app;