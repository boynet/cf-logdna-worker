let requests = [];
let lastTimeSent = Date.now();
const requestsPerBatch = 50;
const maxReuqestsAge = 60000; //in milliseconds

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event))
})

/**
 * Fetch and log a request
 * @param {Request} request
 */
async function handleRequest(event) {
    if (!lastTimeSent) lastTimeSent = Date.now();
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
    let data = {
        'app': 'myApp',
        'meta': {
            'ua' : request.headers.get('user-agent'),
            'referer' : request.headers.get('Referer') || 'empty',
            'ip' : request.headers.get('CF-Connecting-IP'),
            'countryCode' : request.headers.get("cf-ipcountry"),
            'url' : request.url,
            'method' : request.method,
            'x_forwarded_for' : request.headers.get('x_forwarded_for') || "0.0.0",
            'asn' : (request.cf || {}).asn,
            'timestamp' : Date.now()
        }
    };
    data.line = data.meta.countryCode + " " + data.meta.ip + " " + data.meta.url;
    return data;
}

async function postRequests(data) {
    data = JSON.stringify(data);
    let username = 'My logdna Ingestion key';
    let password = '';
    let compiledPass = "";
    let myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json; charset=UTF-8');
    myHeaders.append('Authorization', 'Basic ' + (compiledPass || btoa(username+':'+password)));
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
