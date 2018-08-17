const Crawler = require('../src/index');

const c = new Crawler();

c.queue('https://www.pdftron.com/documentation');

c.shouldFetch((url) => {
  return url.indexOf('/documentation') > -1 && url.indexOf('web/guides') > -1;
})

c.on('done', (data) => {
  console.log(data);
})

c.on('foundURL', (url) => {
  console.log(url);
})

c.start();

