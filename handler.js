'use strict';

const request = require('request');

module.exports.corsProxy = (event, context, callback) => {
  const params = event.queryStringParameters;
  const { Host, host, Origin, origin, ...headers } = event.headers;

  console.log(event);
  console.log(`Got request with params:`, params);

  if (!params.url) {
    const errorResponse = {
      statusCode: 400,
      body: 'Unable get url from \'url\' query parameter'
    };

    callback(null, errorResponse);

    return;
  }

  return new Promise((resolve, reject) => {
    const originalRequestBody = event.body;
    let requestUrl = params.url;

    for (const param of Object.keys(params)) {
      if (param !== 'url') {
        requestUrl += requestUrl.includes('?') ? ('&' + param + '=' + params[param]) : (':' + param + '=' + params[param]);
      }
    }

    request({
      url: requestUrl,
      method: event.httpMethod,
      timeout: 20000,
      json: event.httpMethod === 'POST' ? JSON.parse(originalRequestBody) : null,
      headers: { ...headers, 'Accept-Encoding': '*' },
    }, (err, originalResponse, body) => {
      if (err) {
        console.log(`Got error`, err);
        callback(err);
        reject(err);
        return;
      }

      console.log(`Got response from ${params.url} ---> {statusCode: ${originalResponse.statusCode}}`);
      const proxyBody = originalRequestBody ? JSON.stringify(body) : originalResponse.body;

      const proxyResponse = {
        statusCode: originalResponse.statusCode,
        headers: {
          'Access-Control-Allow-Origin' : '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Credentials' : true,
          'Content-Type': originalResponse.headers['content-type'],
        },
        body: proxyBody
      };

      callback(null, proxyResponse);

      resolve(proxyResponse);
    });
  });
};
