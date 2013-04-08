#!/usr/bin/env node

var fs = require('fs');
var spawn = require('child_process').spawn;
var http = require('http');
var urlparse = require('url');

var _ = require('underscore');
var mongodb = require('mongodb');

var settings = require('./settings_local.js');

function generate_mongo_url(obj) {
    return 'mongodb://' + (obj.username && obj.password ? obj.username + ':' + obj.password + '@' : '') + obj.hostname + ':' + obj.port + '/' + obj.db;
}

var mongourl = generate_mongo_url(settings.mongo);

function analyze(url, data, error) {
    try {
        data = JSON.parse(data);
    } catch (e) {
        console.error(url, ' - Invalid JSON!');
        return;
    }

    var files = data.comps;

    files = files.map(function (f) {
        return {
            type: f.type,
            size: f.size,
            url: decodeURIComponent(f.url)
        };
    });

    var total = 0;
    var types = {};

    files.forEach(function(file) {
        total += file.size;
        if (types[file.type] === undefined) {
            types[file.type] = 0;
        }
        types[file.type] += file.size;
    });

    types = _.map(types, function(v, k) {
        return [k, v];
    });
    types = _.sortBy(types, 1).reverse();
    types.push(['total', total]);

    var size = {
        total: _.object(types),
        resources: _.sortBy(files, 'size').reverse()
    };

    //db.sizes.insert({ts: Date(), url: 'https://marketplace.firefox.com/', total: 590110, html: 30267, css: 82873, cssimage: 124951, js: 252576, image: 99443})
    console.log(url, _.object(types));
}

function yslow(url) {
    var output = '';
    var error = '';

    var args = [__dirname + '/yslow.js', '-icomps', url];
    var job = spawn('phantomjs', args);

    job.stdout.on('data', function(data) {
        output += data;
    });
    job.stderr.on('data', function(data) {
        error += data;
    });
    job.on('exit', function(code) {
        if (code !== 0) {
            console.error('Error:', 'phantomjs', args[0], 'exited:', code);
            if (error) {
                console.error('stderr:', error);
            }
        } else {
            analyze(output, error);
        }
    });
}

(function() {
    setInterval(function() {
        mongodb.connect(mongourl, function(err, conn) {
            conn.collection('urls', function(err, coll) {
                coll.distinct('url', function(err, data) {
                    data.forEach(function(v) {
                        console.log('weighing', v);
                        yslow(v);
                    });
                });
            });
        });
    }, 3000);
})();
