const CDP = require('chrome-remote-interface'), argv = require('minimist')(process.argv.slice(2)),
fs = require('fs');

// CLI Args
const url = argv.url || 'https://www.google.com',
format = argv.format === 'jpeg' ? 'jpeg' : 'png',
viewportWidth = argv.viewportWidth || 1200,
viewportHeight = argv.viewportHeight || 2000,
delay = argv.delay || 0,
userAgent = argv.userAgent,
fullPage = argv.full,
completePath = argv.completePath;

// Start the Chrome Debugging Protocol
CDP(async function(client) {
  // Extract used DevTools domains.
  const {DOM, Emulation, Network, Page, Runtime} = client;

  // Enable events on domains we are interested in.
  await Page.enable();
  await DOM.enable();
  await Network.enable();

  // If user agent override was specified, pass to Network domain
  if (userAgent) {
    await Network.setUserAgentOverride({userAgent});
  }

  // Set up viewport resolution, etc.
  const deviceMetrics = {
    width: viewportWidth,
    height: viewportHeight,
    deviceScaleFactor: 0,
    mobile: false,
    fitWindow: false,
  };
  await Emulation.setDeviceMetricsOverride(deviceMetrics);
  await Emulation.setVisibleSize({width: viewportWidth, height: viewportHeight});

  // Navigate to target page
  await Page.navigate({url});

  // Wait for page load event to take screenshot
  Page.loadEventFired(async () => {
    // If the `full` CLI option was passed, we need to measure the height of
    // the rendered page and use Emulation.setVisibleSize
    if (fullPage) {
      const {root: {nodeId: documentNodeId}} = await DOM.getDocument();
      const {nodeId: bodyNodeId} = await DOM.querySelector({
        selector: 'body',
        nodeId: documentNodeId,
      });
      const {model: {height}} = await DOM.getBoxModel({nodeId: bodyNodeId});

      await Emulation.setVisibleSize({width: viewportWidth, height: height});
      // This forceViewport call ensures that content outside the viewport is
      // rendered, otherwise it shows up as grey. Possibly a bug?
      await Emulation.forceViewport({x: 0, y: 0, scale: 1});
    }

    setTimeout(async function() {
      const screenshot = await Page.captureScreenshot({format});

      const buffer = new Buffer(screenshot.data, 'base64');
      
      fs.writeFile(completePath, buffer, 'base64', function(err) {
        if (err) {
          console.error(err);
        } else {
          console.log('Screenshot saved');
        }
        client.close();
      });
    });
    }, delay);

}).on('error', err => {
  console.error('Cannot connect to browser:', err);
});

