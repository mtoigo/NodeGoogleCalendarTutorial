// Google OAuth Configuration
var googleConfig = {
  clientID: '984619008455-hvrdkbu8g9jplupt90simm42cepfnndc.apps.googleusercontent.com',
  clientSecret: '6paDFGcowNUwz7pilzeWvPby',
  calendarId: 'sjb1qhbicuu3u0kl6suat53h8c@group.calendar.google.com',
  redirectURL: 'http://localhost:2002/auth'
};

// Dependency setup
var express = require('express'),
  moment = require('moment'),
  google = require('googleapis');

// Initialization
var app = express(),
  calendar = google.calendar('v3');
  oAuthClient = new google.auth.OAuth2(googleConfig.clientID, googleConfig.clientSecret, googleConfig.redirectURL),
  authed = false;

// Response for localhost:2002/
app.get('/', function(req, res) {

  // If we're not authenticated, fire off the OAuth flow
  if (!authed) {

    // Generate an OAuth URL and redirect there
    var url = oAuthClient.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/calendar.readonly'
    });
    res.redirect(url);
  } else {

      // Format today's date
      var today = moment().format('YYYY-MM-DD') + 'T';

      // Call google to fetch events for today on our calendar
      calendar.events.list({
        calendarId: googleConfig.calendarId,
        maxResults: 20,
        timeMin: today + '00:00:00.000Z',
        timeMax: today + '23:59:59.000Z',
        auth: oAuthClient
      }, function(err, events) {
        if(err) {
          console.log('Error fetching events');
          console.log(err);
        } else {

          // Send our JSON response back to the browser
          console.log('Successfully fetched events');
          res.send(events);
        }
      });
  }
});

// Return point for oAuth flow, should match googleConfig.redirectURL
app.get('/auth', function(req, res) {

    var code = req.param('code');

    if(code) {
      // Get an access token based on our OAuth code
      oAuthClient.getToken(code, function(err, tokens) {

        if (err) {
          console.log('Error authenticating')
          console.log(err);
        } else {
          console.log('Successfully authenticated');
          console.log(tokens);
          
          // Store our credentials are redirect back to our main page
          oAuthClient.setCredentials(tokens);
          authed = true;
          res.redirect('/');
        }
      });
    } 
});

var server = app.listen(2002, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening at http://%s:%s', host, port);
});