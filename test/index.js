
const assert = require('assert');
const Crawler = require('../src/index');

const handler = require('serve-handler');
const http = require('http');


describe('web-crawler', () => {

  let server = null;
  before(() => {
    server = http.createServer((request, response) => {
      return handler(request, response);
    })

    server.listen(3000, () => {

    })
  });

  after(() => {
    server.close();
  })

  it('gets all links on a page', (done) => {
    const c = new Crawler();
    c.queue('http://localhost:3000/test/html/index.html');
    c.on('done', (data) => {
      assert.equal(data.length, 4);
      assert(data.indexOf('http://localhost:3000/test/html/end.html') > -1);
      done();
    })
    c.start();
  }).timeout(10000);

  it('can filter out unwanted links', (done) => {
    const c = new Crawler();
    c.queue('http://localhost:3000/test/html/index.html');
    c.on('done', (data) => {
      assert.equal(data.length, 3);
      assert(data.indexOf('http://localhost:3000/test/html/end.html') === -1);
      done();
    });
    c.shouldFetch((url) => {
      return url.indexOf('end.html') === -1;
    })
    c.start();
  }).timeout(10000)

  it('calls a fetched callback', (done) => {

    let count = 0;

    const c = new Crawler();
    c.queue('http://localhost:3000/test/html/index.html');
    c.on('done', (data) => {
      assert.equal(count, 4);
      done();
    });
    
    c.on('fetched', ({ html, url }) => {
      assert(html);
      assert(url);
      count++;
    })

    c.start();
  }).timeout(10000)

  it('calls a foundURL callback', (done) => {

    let count = 0;

    const c = new Crawler();
    c.queue('http://localhost:3000/test/html/index.html');
    c.on('done', (data) => {
      assert.equal(count, 4);
      done();
    });
    
    c.on('foundURL', (url, from) => {
      assert(url);
      count++;
    });

    c.start();
  }).timeout(10000);

  it('handles initial page with no found outbound links', (done) => {

    const c = new Crawler();
    c.queue('http://localhost:3000/test/html/end.html');
    c.on('done', (data) => {
      assert.equal(data.length, 1);
      done();
    });
    
    c.start();
  }).timeout(10000)

})
