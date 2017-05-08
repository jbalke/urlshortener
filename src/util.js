function isDuplicate(url) {
  return UrlEntry
    .findOne({ original: url })
    .then(doc => {
      return doc ? doc.shortCode : false;
    });
}

function isValidUrl(url) {
  // Must comply to this format () means optional:
  // http(s)://(www.)domain.ext(/)(whatever follows)
  let regEx = /^https?:\/\/(\S+\.)?(\S+\.)(\S+)\S*/;
  return regEx.test(url);
}

module.exports.isDuplicate = isDuplicate;
module.exports.isValidUrl = isValidUrl;