const async = require('async'),
    execFile = require('child_process').execFile,
    fs = require('fs'),
    sites = fs.readFileSync('sites.txt').toString().split("\n"),
    argv = require('minimist')(process.argv.slice(2)),
    chrome = argv.chrome,
    mkdirp = require('mkdirp');

function launchHeadlessChrome(url, cp, callback) {
    execFile('node', ['chromeDriver.js', '--url=' + url, '--completePath='+cp], callback);
}

function launchPhantom(url, cp, callback) {
    execFile('phantomjs', ['phantomDriver.js', url, cp], callback);
}



/**
 * Helper Functions
 */
var stripTrailingSlash = str => {
    if (str.substr(-1) == '/') {
        return str.substr(0, str.length - 1);
    }
    return str;
}

var completePath = (url, callback) => {
    const r = /:\/\/(.[^/]+)/;
    var name = '';
    var domain = url.match(r)[1];
    var path = url.replace(/(^\w+:|^)\/\//, '');
    if (path !== domain) {
        name = stripTrailingSlash(path.replace(domain + '/', '').replace('/', '_')) + '.png';
    } else {
        name = domain + '.png';
    }
    getFolderStucture(domain, (folderStructure) => {
        callback(folderStructure + '/' + name);
    });
};

var getFolderStucture = (domain, callback) => {
    const dateObj = new Date(),
        month = dateObj.getUTCMonth() + 1,
        day = dateObj.getUTCDate(),
        year = dateObj.getUTCFullYear(),
        folderStructure = 'screenshots/' + year + '/' + month + '/' + day + '/' + domain;
    if (!fs.existsSync(folderStructure)) {
        mkdirp(folderStructure, (err) => {

            callback(folderStructure);

        });
    } else {
        callback(folderStructure);
    }
};

if (chrome) {
    async.eachSeries(sites, (site, callback) => {
        completePath(site, cp => {
            launchHeadlessChrome(site, cp, (err, stdout, stderr) => {
                console.log(stdout);
                callback();
            });
        });
    });
} else {
    async.eachSeries(sites, (site, callback) => {
        completePath(site, cp => {
            launchPhantom(site, cp, (err, stdout, stderr) => {
                console.log(stdout);
                callback();
            });
        });
    });
}
