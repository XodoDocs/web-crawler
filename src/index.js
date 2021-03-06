const Puppeteer = require('puppeteer');


class Crawler {

  constructor(options = {}) {
    this._debug = options.debug || false;
    this._maxConnections = options.maxConnections || 10;

    this._callbacks = {
      done: null,
      fetched: null,
      foundURL: null,
      notFound: null
    };

    this._data = {};
    this._queue = [];
    this._seen = []
    this._pageCount = 0;

    this._calledDone = false;

    this._shouldFetch = () => true;
  }

  on = (key, func) => {
    switch (key) {
      case 'done':
        this._callbacks.done = func;
        break;
      case 'fetched':
        this._callbacks.fetched = func;
        break;
      case 'foundURL':
        this._callbacks.foundURL = func;
        break;
      case 'loadError':
        this._callbacks.notFound = func;
        break;
    }
  }

  shouldFetch = (f) => {
    this._shouldFetch = f;
  }

  _findLinks = async (page) => {
    try {
      const hrefs = await page.$$eval('a', hrefs => hrefs.map((a) => {
        return a.href;
      }));
      return hrefs.map(h => this._filterURL(h));
    } catch (e) {
      return [];
    }
  }

  _fetchPage = async (url, foundFrom) => {

    if (this._debug) {
      console.log(`Fetching ${url}`);
    }

    const page = await this._browser.newPage();
    let error = false;

    page.on("response", response => {
      const status = response.status();
      if (status < 200 || status >= 302) {
        error = status;
      }
    });

    try {
      const p = page.waitForNavigation({waituntil: 'domcontentloaded'});
      await page.goto(url, {timeout: 30000}).catch((e) => {
        error = 'timeout';
        return;
      });
      await p;
      
    } catch (e) {
      error = 'unknown';
    }
    
    if (error) {
      if (this._debug) {
        console.log(`ERROR: ${error}`);
      }

      if ( typeof error === 'number' && this._callbacks.notFound) {
        this._callbacks.notFound(url, foundFrom, error);
      }

      await page.close();

      this._flush();
      this._pageCount--;
      return;
    }

    const hrefs = await this._findLinks(page);

    let html = null;

    // we only need the HTML if the user is requesting it in a callback
    if (this._callbacks.fetched) {
      html = await page.content();
    }
    
    let o = { url, html };

    if (this._callbacks.fetched) {
      this._callbacks.fetched(o);
    }

    this._data[url] = true;

    hrefs.forEach(href => {
      this.queue(href, url)
    });

    await page.close();

    this._pageCount--;
    this._flush();
  }
  
  _flush = () => {
    let diff = this._maxConnections - this._pageCount;

    if (diff > this._queue.length) {
      diff = this._queue.length;
    }

    if (this._queue.length === 0 && this._pageCount === 0) {
      this._done();
      return;
    }

    for (let i = 0; i < diff; i++) {
      this._pageCount++;
      const { url, foundFrom } = this._queue.pop();
      this._seen.push(url);
      setTimeout(() => {
        this._fetchPage(url, foundFrom);
      }, 0)
    }
  }

  _done = async () => {
    if (this._calledDone) return;
    await this._browser.close();

    if (this._callbacks.done) {
      this._callbacks.done(Object.keys(this._data));
    }

    this._calledDone = true;
  }

  _filterURL = (url) => {
    url = url.split('#')[0];

    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }

    return url;
  }

  _getFetchedURLs = () => Object.keys(this._data);

  queue = (url, foundFrom) => {
    if (
      this._queue.findIndex(({ url: queueUrl }) => url.trim() === queueUrl.trim() ) === -1 &&
      this._seen.indexOf(url) === -1 &&
      this._getFetchedURLs().indexOf(url) === -1 &&
      this._shouldFetch(url)
    ) {
      if (this._debug) {
        console.log(`Queueing ${url}`);
      }

      if (this._callbacks.foundURL) {
        this._callbacks.foundURL(url, foundFrom);
      }

      this._queue.push({ url, foundFrom });
    } else {
      if (this._debug) {
        console.log(`Rejecting ${url}`);
      }
    }
  }

  start = async () => {
    if (this._browser) return;
    if (this._queue.length === 0) return;

    this._browser = await Puppeteer.launch({ args: ['--disable-dev-shm-usage', '--no-sandbox',  '--disable-setuid-sandbox'] });

    // call a callback for any URLs queued before the callback is set
    this._queue.forEach(({ url }) => {
      if (this._callbacks.foundURL) {
        this._callbacks.foundURL(url, url);
      }
    })

    this._flush();
  }
}


module.exports = Crawler;