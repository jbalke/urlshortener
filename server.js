const app = require('./src/app');
const PORT = process.env.PORT || 3000;

function logToConsole(msg, msgType) {
  if (typeof (msgType) === 'undefined') msgType = "info";
  console.log(`[${msgType}] ${msg}`)
}

app.listen(PORT, function() {
    console.log('URL shortener microservice listening on port ' + PORT);
});

process.on('unhandledRejection', (reason, p) => {
  logToConsole(`Unhandled Rejection at: Promise ${p}, reason: ${reason}`, 'error');
  // application specific logging, throwing an error, or other logic here
});

