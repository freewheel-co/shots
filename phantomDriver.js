var system = require('system');
var  url = system.args[1];
var  completePath = system.args[2];



function capture(address, p, size, callback) {
    var page = require('webpage').create();
    page.settings.resourceTimeout = 30000;
    page.onResourceTimeout = function (e) {
        console.log("error" + e.errorCode);   // it'll probably be 408
        console.log(e.errorString); // it'll probably be 'Network timeout on resource'
        console.log(e.url);         // the url whose request timed out
        callback();
    };
    page.viewportSize = {
        width: size[0],
        height: size[1]
    };
    page.zoomFactor = 1;
     page.open(address, function (status) {
        window.setTimeout(function () {
         	page.render(p);
            page.close();
            callback();
        },4000);
     });

 }

 capture(url, completePath, [1200, 3000], function() {
 	phantom.exit();
 });
