
var express = require('express');
var app = express();
var http = require('http');
var httpServer = http.Server(app);

app.use(express.static('public'));
app.use(express.static('public/js'));
app.use(express.static('public/lib/d3'));

app.listen(8080, "192.168.1.68");