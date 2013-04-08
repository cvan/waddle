#!/usr/bin/env node

var http = require('http');
var url = require('url');

var mongodb = require('mongodb');

var settings = require('./settings_local.js');


function generate_mongo_url(obj) {
    return 'mongodb://' + (obj.username && obj.password ? obj.username + ':' + obj.password + '@' : '') + obj.hostname + ':' + obj.port + '/' + obj.db;
}

var mongourl = generate_mongo_url(settings.mongo);

http.createServer(function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'  // CORS
    });

    var path = url.parse(req.url, true);
    var qs = path.query;

    if (path.pathname == '/urls') {
        mongodb.connect(mongourl, function(err, conn) {
            conn.collection('urls', function(err, coll) {
                coll.distinct('url', function(err, data) {
                    console.log(err, data);
                    res.write(JSON.stringify(data));
                    res.end('\n');
                });
            });
        });
    } else if (qs.url) {
        mongodb.connect(mongourl, function(err, conn) {
            conn.collection('urls', function(err, coll) {
                // Record the URL (if it does not exist) so we know to
                // start weighing it.
                coll.ensureIndex({url: qs.url}, {unique: true});
                coll.update({url: qs.url}, {url: qs.url}, {upsert: true});

                // Return the sizes for that URL.
                conn.collection('sizes', function(err, coll) {
                    coll.find({url: qs.url}).sort({ts: 1}).toArray(function(err, data) {
                        console.log(err, data);
                        res.write(JSON.stringify(data));
                        res.end('\n');
                    });
                });
            });
        });
    } else {
        res.write(JSON.stringify([]));
        res.end('\n');
    }

}).listen(settings.port, settings.host);
