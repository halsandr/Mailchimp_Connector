function getConfig(request) {
  var service = getService();
  var response = JSON.parse(UrlFetchApp.fetch("https://us4.api.mailchimp.com/3.0/lists?count=500&fields=lists.id,lists.name", {
    headers: {
      Authorization: 'Bearer ' + service.getAccessToken()
    }
  }));
  var config = {
    configParams: [
      {
        type: "SELECT_SINGLE",
        name: "listID",
        displayName: "List ID",
        helpText: "Please select the List ID for which you would like to retrieve the Statistics.",
        options: []
      }
    ]
  };
  response.lists.forEach(function(field){
    config.configParams[0].options.push({
      label: field.name,
      value: field.id
    });
  });
  return config;
};


var mailchimpSchema = [
  {
    name: 'title',
    label: 'Campaign Title',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION'
    }
  },
  {
    name: 'dateSent',
    label: 'Date Sent',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION'
    }
  },
  {
    name: 'emailsSent',
    label: 'Number of Emails Sent',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC'
    }
  },
  {
    name: 'opensTotal',
    label: 'Total Emails Opened',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC'
    }
  },
  {
    name: 'openRate',
    label: 'Email Open Percentage',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC'
    }
  },
  {
    name: 'clicksTotal',
    label: 'Total Link Clicks in Emails',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC'
    }
  },
  {
    name: 'clickRate',
    label: 'Email Link Click Percentage',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC'
    }
  },
  {
    name: 'stdOpen',
    label: 'Industry Standard Open Percentage',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC'
    }
  },
  {
    name: 'stdClick',
    label: 'Industry Standard Click Percentage',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC'
    }
  }
];

function getSchema(request) {
  return {schema: mailchimpSchema};
};

function getData(request) {
  var service = getService();
  var url = 'https://us4.api.mailchimp.com/3.0/reports?count=500&fields=reports.id,reports.campaign_title,reports.list_id,reports.send_time,reports.emails_sent,reports.opens.opens_total,reports.opens.open_rate,reports.clicks.clicks_total,reports.clicks.click_rate,reports.industry_stats.open_rate,reports.industry_stats.click_rate';
  var response = UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + service.getAccessToken()
    }
  });
  var result = JSON.parse(response.getContentText());
  // Prepare the schema for the fields requested.
  var dataSchema = [];
  request.fields.forEach(function(field) {
    for (var i = 0; i < mailchimpSchema.length; i++) {
      if (mailchimpSchema[i].name === field.name) {
        dataSchema.push(mailchimpSchema[i]);
        break;
      }
    }
  });
  var data = [];

  result.reports.forEach(function(repo){
    var values = []
    if(repo.list_id == request.configParams.listID) {
      dataSchema.forEach(function(field) {
        switch(field.name) {
          case 'title':
            values.push(repo.campaign_title);
            break;
          case 'dateSent':
            var mcTime = repo.send_time;
            var myTime = mcTime.substring(0,4) + mcTime.substring(5,7) + mcTime.substring(8,10);
            values.push(myTime);
            break;
          case 'emailsSent':
            values.push(repo.emails_sent);
            break;
          case 'opensTotal':
            values.push(repo.opens.opens_total);
            break;
          case 'openRate':
            var myPerc = Number((repo.opens.open_rate * 100).toFixed(1));
            values.push(myPerc);
            break;
          case 'clicksTotal':
            values.push(repo.clicks.clicks_total);
            break;
          case 'clickRate':
            var myPerc = Number((repo.clicks.click_rate * 100).toFixed(1));
            values.push(myPerc);
            break;
          case 'stdOpen':
            var myPerc = Number((repo.industry_stats.open_rate * 100).toFixed(1));
            values.push(myPerc);
            break;
          case 'stdClick':
            var myPerc = Number((repo.industry_stats.click_rate * 100).toFixed(1));
            values.push(myPerc);
            break;
          default:
            values.push('');
        }
      });
        data.push({
          values: values
        });
    }
  });
   
  // Return the tabular data for the given request.
  return {
    schema: dataSchema,
    rows: data
  };
};

function isAdminUser() {
  if (Session.getEffectiveUser().getEmail() == "#############@gmail.com") {
    return true;
  }
}

function getAuthType() {
  // Returns the authentication method required.
  var response = {
    "type": "OAUTH2"
  };
  return response;
}
