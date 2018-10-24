# cf-dnalog-worker
simple cloudflare worker recipe to send logs into [logdna](https://logdna.com/)

## how to use
copy index.js content into your worker
change myApp and myHostName into whatever you want, read the logdna [Ingest API](https://docs.logdna.com/v1.0/reference#api)

* requestsPerBatch - how many requests to maximum batch per request
* maxReuqestsAge - how much time to maximum old requests in the memory before sending it 
