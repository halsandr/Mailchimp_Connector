var CLIENT_ID = '#############';
var CLIENT_SECRET = '######################################';

/*
 * Authorizes and makes a request to the Mailchimp API.
 */

function runMCAuth(e) {
  var service = getService();
  var html = '';
  if (service.hasAccess()) {
    var dc = JSON.parse(UrlFetchApp.fetch("https://login.mailchimp.com/oauth2/metadata", {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    })).dc;
    var url = 'https://' + dc + '.api.mailchimp.com/3.0/lists';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + service.getAccessToken()
      }
    });
    var result = JSON.parse(response.getContentText());
    Logger.log(JSON.stringify(result, null, 2));
  } else {
    var authorizationUrl = service.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s',
        authorizationUrl);
  }
}

/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
  var service = getService();
  service.reset();
}

/**
 * Configures the service.
 */
function getService() {
  return OAuth2.createService('MailChimp')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://login.mailchimp.com/oauth2/authorize')
      .setTokenUrl('https://login.mailchimp.com/oauth2/token')

      // Set the client ID and secret.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function that should be invoked to complete
      // the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties());
}

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var service = getService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success! Please close the tab and continue.');
  } else {
    return HtmlService.createHtmlOutput('Denied!  Please close the tab and contact the developer.');
  }
}

function get3PAuthorizationUrls() {
  var service = getService();
  if (service == null) {
    return '';
  }
  return service.getAuthorizationUrl();
}

function isAuthValid() {
  var service = getService();
  if (service == null) {
    return false; 
  }
  return service.hasAccess();
}
