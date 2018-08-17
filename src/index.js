const Puppeteer = require('puppeteer');

class Crawler {

  constructor(options = {}) {
    this._debug = options.debug || false;
    this._maxConnections = options.maxConnections || 50;
    this._getHTML = options.getHTML || false;

    this._callbacks = {
      success: null,
      done: null,
      fetched: null,
      foundURL: null
    };

    this._data = {};
    this._queue = [];
    this._pageCount = 0;

    this._shouldFetch = () => true;
  }

  on = (key, func) => {
    switch (key) {
      case 'success':
        this._callbacks.success = func;
        break;
      case 'done':
        this._callbacks.done = func;
        break;
      case 'fetched':
        this._callbacks.fetched = func;
        break;
      case 'foundURL':
        this._callbacks.foundURL = func;
        break;
    }
  }

  shouldFetch = (f) => {
    this._shouldFetch = f;
  }

  _findLinks = async (page) => {
    const hrefs = await page.$$eval('a', hrefs => hrefs.map((a) => {
      return a.href;
    }));
    return hrefs.map(h => this._filterURL(h));
  }

  _fetchPage = async (url) => {

    if (this.debug) {
      console.log(`Fetching ${url}`);
    }

    this._pageCount++;

    const page = await this._browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });

    const hrefs = await this._findLinks(page);

    const html = await page.content();
    
    let o = { url, html };

    if (this._callbacks.fetched) {
      this._callbacks.fetched(o);
    }

    this._data[url] = o;

    hrefs.forEach(href => this.queue(href));

    this._pageCount--;
    this._getNext();
  }

  _getNext = () => {
    if (this._queue.length === 0) {
      this._done();
      return;
    }

    if (this._pageCount < this._maxConnections) {
      const url = this._queue.pop();
      this._fetchPage(url);
    }
  }

  _done = () => {
    if (this._callbacks.done) {
      this._callbacks.done(this._data);
    }
  }

  _filterURL = (url) => {
    url = url.split('#')[0];

    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }

    return url;
  }

  _getFetchedURLs = () => Object.keys(this._data);

  queue = (url) => {
    if (
      this._queue.indexOf(url) === -1 &&
      this._getFetchedURLs().indexOf(url) === -1 &&
      this._shouldFetch(url)
    ) {
      if (this.debug) {
        console.log(`Queueing ${url}`);
      }

      if (this._callbacks.foundURL) {
        this._callbacks.foundURL(url);
      }

      this._queue.push(url);
    }
  }

  start = async () => {
    if (this._browser) return;
    if (this._queue.length === 0) return;

    this._browser = await Puppeteer.launch();

    for (let i = 0; i < this._queue.length; i++) {
      this._getNext();
    }
  }
}


module.exports = Crawler;