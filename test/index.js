const Crawler = require('../dist/web-crawler');

const c = new Crawler({ debug: false });

c.queue('https://www.pdftron.com/documentation');

c.shouldFetch((url) => {
  return url.indexOf('/documentation') > -1 && url.indexOf('web/guides') > -1;
})

c.on('foundURL', (url) => {
  // console.log(url);
})

c.start();

