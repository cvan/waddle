(function() {

    var apiUrl = 'http://localhost:7777';
    var url = location.search.substr(1) || localStorage.previousUrl;

    // Remember this URL for next time.
    localStorage.previousUrl = url;

    // Redirect to this query's permalink.
    if (location.search.substr(1) != url) {
        location.search = url;
    }

    document.title = 'Size of ' + url + ' | ' + document.title;

    var zip = false;
    var zipColumnAdded = false;

    google.load('visualization', '1.0', {
        packages: ['corechart']
    });
    google.setOnLoadCallback(drawChart);

    function drawChart() {
        var options = {
            hAxis: {
                title: 'Timestamp',
                titleTextStyle: {color: '#999'}
            },
            height: 700,
            pointSize: 4,
            title: 'Size of ' + url,
            vAxis: {
                title: 'Size (in bytes)',
                titleTextStyle: {color: '#999'}
            }
        };

        var chart = new google.visualization.LineChart(
            document.querySelectorAll('.chart')[0]);

        var data = new google.visualization.DataTable();
        data.addColumn('date', 'Timestamp');
        data.addColumn('number', 'Total');
        data.addColumn('number', 'HTML');
        data.addColumn('number', 'CSS');
        data.addColumn('number', 'CSS Images');
        data.addColumn('number', 'Images');
        data.addColumn('number', 'JS');

        var rows = [];
        var vals = [];

        // Get previous data from localStorage.
        // TODO: Use google.visualization's `fromJSON` to load in from `localStorage`.
        rows = JSON.parse(localStorage['previousData-' + JSON.stringify(url)] || '[]');
        if (rows.length) {
            rows.forEach(function(v, k) {
                if (v.length) {
                    // Turn `JSON.stringify`-ied timestamps back into `Date` objects.
                    rows[k][0] = new Date(v[0]);
                    if (v.length == 8 && !zipColumnAdded) {
                        // Add it as a column then.
                        data.insertColumn(1, 'number', 'ZIP');
                        zipColumnAdded = true;
                    }
                }
            });
            data.addRows(rows);
            chart.draw(data, options);
        }

        var xhr = new XMLHttpRequest();
        xhr.open('GET', apiUrl + '/?url=' + url, true);
        xhr.send(null);
        xhr.onload = function() {
            var response = JSON.parse(xhr.response);
            response.forEach(function(v) {
                if ('zip' in v) {
                    zip = true;
                    if (!zipColumnAdded) {
                        // Add it as a column then.
                        data.insertColumn(1, 'number', 'ZIP');
                        zipColumnAdded = true;
                    }
                }
            });

            rows = [];
            data.removeRows(0, data.getNumberOfRows());
            response.forEach(function(v) {
                vals = [new Date(v.ts)];
                if (zip) {
                    vals.push(v.zip || 0);
                }
                rows.push(vals.concat([
                    v.total,
                    v.html,
                    v.css,
                    v.cssimage,
                    v.image,
                    v.js
                ]));
            });

            data.addRows(rows);
            chart.draw(data, options);

            localStorage.previousUrls = JSON.stringify(JSON.parse(localStorage.previousUrls || '[]').concat([url]));
            localStorage['previousData-' + JSON.stringify(url)] = JSON.stringify(rows);
        };
    }

    // On change of <select> show a different site.
    var form = document.getElementsByTagName('form')[0];
    var select = document.getElementsByTagName('select')[0];
    var newUrl = document.querySelectorAll('.newUrl')[0];

    function toggleSelect() {
        if (this.value) {
            location.search = '?' + this.value;
        } else {
            newUrl.classList.remove('hidden');
            newUrl.focus();
        }
    }

    select.addEventListener('change', toggleSelect, true);
    select.addEventListener('focus', function() {
        if (!this.value) {
            newUrl.classList.remove('hidden');
            newUrl.focus();
        }
    }, true);
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (newUrl.value) {
            location.search = '?' + newUrl.value;
        }
    }, true);

    newUrl.addEventListener('blur', function() {
        if (newUrl.value) {
            location.search = '?' + newUrl.value;
        }
        newUrl.classList.add('hidden');
        select.classList.remove('hidden');
    })

    // Get previous sites list from localStorage.
    if (localStorage.previousSites) {
        select.innerHTML = localStorage.previousSites;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl + '/urls', true);
    xhr.send(null);
    xhr.onload = function() {
        var newOptions = '<option></option>';
        var response = JSON.parse(xhr.response);
        var selected = false;

        response.forEach(function(v) {
            if (v == url) {
                selected = true;
            }
            newOptions += '<option' + (v == url ? ' selected' : '') + '>' + v + '</option>';
        });
        if (!selected) {
            newOptions += '<option selected>' + url + '</option>';
        }

        select.innerHTML = newOptions;
        localStorage.previousSites = newOptions;
    };

})();
