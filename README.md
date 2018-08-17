# Web crawler

A simple NodeJS web crawler that actually executes JS!

## Usage

### constructor(options)

```js
const c = new Crawler(options);
```

- `options` <[Object]>
  - `debug` <[boolean]> Whether to display logs during execution. Defaults to `false`
  - `maxConnections` <[number]> Number of simultanious connections that can be open. Defaults to `10`

### .queue(url)
Adds a URl to the fetch queue

- `url` <[string]> URL to start crawling at

### .start()
Starts processing the queue

### .shouldFetch(callback)
A function that determines if a URL should be fetched or not.
- `callback` <[Function(string)]> function that determines if a url is fetched. Is passed the URL to be fetched. Must return `true` or `false`. If `true` is returned, the URL will be fetched.

### .on(key, callback)
Attach an event listener to the instance. 

- `key` <[string]> type of event listener to attach. Can be one of:
  - `done` Called when the process is done. `callback` is passed a dump of data from the crawl.
  - `fetched` Called when a page is fully fetched. `callback` is passed an object with `html` and `url`.
  - `foundURL` Called when a new URL is found and added to the queue. `callback` is passed the URL.


## Example

```js
const Crawler = require('this_module');

const c = new Crawler({ debug: false });

c.queue('https://www.pdftron.com/documentation');

c.shouldFetch((url) => {
  return url.indexOf('/documentation') > -1 && url.indexOf('web/guides') > -1;
})

c.on('foundURL', (url) => {
  console.log(url);
})

c.on('done', (data) => {
  console.log(data);
})

c.on('fetched', ({ url, html }) => {
  console.log(url, html);
})

c.start();
```

## Developing

```
git clone https://github.com/XodoDocs/web-crawler.git
cd web-crawler
npm i
npm run test 
```
