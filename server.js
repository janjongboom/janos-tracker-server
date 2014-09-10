var express = require("express");
var request = require("request");
var helper = require("./helper");
var bodyParser = require("body-parser");
var nstore = require("nstore");

var app = express();
app.use(bodyParser.json());
app.use(helper.allowCors);

var inited = false;
var db = nstore.new('push.db', function(err) {
  if (inited) {
    return console.error('stupid db');
  }
  inited = true;
  if (err) {
    console.error('Cannot create push.db file', err);
    process.exit(1);
  }
  app.listen(process.env.PORT || 3000);
  console.log('Listening at', process.env.PORT || 3000);
});

app.post('/register', function(req, res, next) {
  if (!req.body.name) {
    return next('Need name in body');
  }
  if (!req.body.url) {
    return next('Need url in body');
  }

  db.get(req.body.name, function(err, user) {
    var doc;
    if (err && err.toString().indexOf('Document does not exist') > -1) {
      doc = {
        name: req.body.name,
        url: req.body.url,
        version: 1
      };
    }
    else if (err) {
      return next(err);
    }
    else {
      doc = user;
      doc.url = req.body.url;
    }

    console.log('saving', doc);
    db.save(doc.name, doc, function(err) {
      if (err) {
        console.error('Saving failed', err, req.body);
        return next(err);
      }

      res.send('OK!');
    });
  });
});

app.post('/trigger/:name', function(req, res, next) {
  console.log('hello', req.params.name);
  db.get(req.params.name, function(err, doc, key) {
    console.log('got db', req.params.name);
    if (err) {
      console.error('get', req.params.name, 'failed', err);
      return next(err);
    }

    // let's notify the user
    request.put({
      url: doc.url,
      body: 'version=' + (++doc.version)
    }, function(aErr, aRes, aBody) {
      if (aErr) {
        console.error('making request to push server failed', aErr);
        return next(aErr);
      }
      else if (aRes.statusCode !== 200) {
        console.error('expected statuscode 200 but was', aRes.statusCode);
        return next('remote server responded ' + aRes.statusCode);
      }
      console.log('Trigger sent to', key, doc.url, doc.version);

      db.save(key, doc, function(err) {
        if (err) {
          console.error('updating', key, 'failed', err);
        }
        res.send('OK');
      });
    });
  });
});

app.post('/location/:name', function(req, res, next) {
  db.get(req.params.name, function(err, doc, key) {
    if (err) {
      return next(err);
    }

    doc.location = {
      lat: req.body.lat,
      lon: req.body.lon,
      accuracy: req.body.accuracy,
      datetime: +new Date()
    };

    console.log('updating location for', key, 'to', doc.location);

    db.save(doc.name, doc, function(err) {
      if (err) {
        return next(err);
      }

      res.send('OK');
    });
  });
});

app.get('/location/:name', function(req, res, next) {
  require('fs').readFile(__dirname + '/location.html', 'utf8', function(err, data) {
    if (err) return next(err);

    db.get(req.params.name, function(err, doc) {
      if (err) return next(err);

      data = data.replace(/%name%/g, doc.name);

      data = data.replace(/%show%/g, doc.location ? '' : 'display: none');

      doc.location = doc.location || {};
      data = data.replace(/%lat%/g, doc.location.lat);
      data = data.replace(/%lon%/g, doc.location.lon);
      data = data.replace(/%accuracy%/g, doc.location.accuracy);
      if (doc.location.datetime) {
        data = data.replace(/%updated%/g, new Date(doc.location.datetime).toISOString());
      }

      res.send(data);
    });
  });
});
