let requests = [];
let lastTimeSent = Date.now();
let lastOriginTime = 0;
const requestsPerBatch = 25;
const maxReuqestsAge = 60000; //in milliseconds


addEventListener('fetch', event => {
    event.respondWith(handleRequest(event))
})

/**
 * Fetch and log a request
 * @param {Request} request
 */
async function handleRequest(event) {

    requests.push(getRequestData(event.request));
    if (requests.length >= requestsPerBatch || (Date.now() - lastTimeSent >= maxReuqestsAge)) {
      try {
          event.waitUntil(postRequests({'lines': requests}))
        } catch (err) {
          //console.log(err.stack || err);
        }
    }
    const response = await fetch(event.request)
    return response
}

function getRequestData(request) {
    let data = {};
    let meta = {};
    meta['referer'] = request.headers.get('Referer') || 'empty';
    meta['ip'] = request.headers.get('CF-Connecting-IP');
    meta['ua'] = request.headers.get('user-agent');
    meta['countryCode'] = request.headers.get("cf-ipcountry");
    meta['url'] = request.url;
    meta['method'] = request.method;
    meta['x_forwarded_for'] = request.headers.get('x_forwarded_for') || "0.0.0";
    meta['asn'] = (request.cf || {}).asn;
    data['timestamp'] = Date.now();
    data['line'] = meta['countryCode'] + " " + meta['ip'] + " " + meta['url'];
    data['app'] = 'myApp';
    data['meta'] = meta;
    return data;
}

async function postRequests(data) {
    data = JSON.stringify(data);
    let username = 'put your Ingestion key here';
    let password = '';
    let compiledPass = '' ;//btoa(username+':'+password);
    let myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json; charset=UTF-8');
    myHeaders.append('Authorization', 'Basic ' + (compiledPass || btoa(username+':'+password););
    requests = [];
    lastTimeSent = Date.now();
    try {
        return fetch('https://logs.logdna.com/logs/ingest?hostname=myHostName', {
            method: 'POST',
            headers: myHeaders,
            body: data
        }).then(function (r) {
            //console.log(r.status, r.text());
        });
    } catch (err) {
        //console.log(err.stack || err);
    }
}
