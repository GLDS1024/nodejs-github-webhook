const { exec } = require('node:child_process');
var http = require('http');
var crypto = require('crypto');
var url = require('url');
const fs = require('fs');


var secret = 'amazingkey'; // secret key of the webhook
var port = 8082; // port

http.createServer(function (req, res) {

  console.log("request received");


  var path = url.parse(req.url).pathname;

  if (path != '/push' || req.method != 'POST') {
    res.writeHead(400, { "Content-Type": "application/json" });
    var data = JSON.stringify({ "error": "invalid request" });
    return res.end(data);
  }


  var jsonString = '';
  req.on('data', function (data) {
    jsonString += data;
  });

  req.on('end', function () {
    var hash = "sha1=" + crypto.createHmac('sha1', secret).update(jsonString).digest('hex');
    if (hash != req.headers['x-hub-signature']) {
      console.log('invalid key');
      var data = JSON.stringify({ "error": "invalid key", key: hash });
      return res.end(data);
    }

    console.log("running hook.sh");
    var date = new Date((new Date()).getTime());
    Y = date.getFullYear() + '-';
    M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate());

    fs.appendFile('top_'+ Y + M + D + '.log', '\n' + jsonString, err => {
      if (err) {
        console.error(err);
      }
    });

    try {

      exec('cd ../top100/api-app && git pull', (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      });
    } catch (error) {
      console.log(error);
    }


    res.writeHead(200, { "Content-Type": "application/json" });

    var data = JSON.stringify({ "success": true });
    return res.end(data);

  });


}).listen(port);

console.log("Server listening at " + port);
