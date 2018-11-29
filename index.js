let requests = [];
let workerInception, workerId, requestStartTime, requestEndTime;
let batchIsRunning = false;
const maxRequestsPerBatch = 150;

addEventListener('fetch', event => {
    event.passThroughOnException();
    event.respondWith(logRequests(event));
})

async function logRequests(event) {
    if (!batchIsRunning) {
        event.waitUntil(handleBatch(event));
    }
    if (requests.length >= maxRequestsPerBatch) {
        event.waitUntil(postRequests())
    }
    requestStartTime = Date.now();
    if (!workerInception) workerInception = Date.now();
    if (!workerId) workerId = makeid(6);
    const response = await fetch(event.request)
    requestEndTime = Date.now();
    await requests.push(getRequestData(event.request, response));
    return response
}

async function handleBatch(event) {
    batchIsRunning = true;
    await sleep(10000)
    try {
        if (requests.length) event.waitUntil(postRequests())
    } catch (e) {

    }
    requests = [];
    batchIsRunning = false;
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

function getRequestData(request, re) {
    let data = {
        'app': 'myApp',
        'timestamp': Date.now(),
        'meta': {
            'ua': request.headers.get('user-agent'),
            'referer': request.headers.get('Referer') || 'empty',
            'ip': request.headers.get('CF-Connecting-IP'),
            'countryCode': (request.cf || {}).country,
            'colo': (request.cf || {}).colo,
            'workerInception': workerInception,
            'workerId': workerId,
            'url': request.url,
            'method': request.method,
            'x_forwarded_for': request.headers.get('x_forwarded_for') || "0.0.0.0",
            'asn': (request.cf || {}).asn,
            'cfRay': request.headers.get('cf-ray'),
            'status': (re || {}).status,
            'originTime': (requestEndTime - requestStartTime),
            'cfCache': (re) ? (re.headers.get('CF-Cache-Status') || 'miss') : 'MISS',
        }
    };
    data.line = data.meta.status + " " + data.meta.countryCode + " " + data.meta.cfCache + " " + data.meta.originTime + 'ms' + " " + data.meta.ip + " " + data.meta.url;
    return data;
}

async function postRequests() {
    //console.log('posting',data);
    let data = JSON.stringify({'lines': requests});
    const username = 'My logdna Ingestion key';
    const password = '';
    const compiledPass = '';
    const hostname = 'example.com';
    let myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json; charset=UTF-8');
    myHeaders.append('Authorization', 'Basic ' + (compiledPass || btoa(username + ':' + password)));
    try {
        return fetch('https://logs.logdna.com/logs/ingest?tag=worker&hostname=' + hostname, {
            method: 'POST',
            headers: myHeaders,
            body: data
        }).then(function (r) {
            requests = [];
        });
    } catch (err) {
        //console.log(err.stack || err);
    }
}

function makeid(lenght) {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789'
    for (let i = 0; i < lenght; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}
