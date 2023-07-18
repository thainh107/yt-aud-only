var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const helmet = require('helmet');
const http = require("http");
const url = require("url");
const ytdl = require("ytdl-core");
const ytpl = require('ytpl');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
app.use(
    helmet({
      contentSecurityPolicy: false,
      xDownloadOptions: false,
    })
  );

var port = process.env.PORT || 3340;


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(418).send("oh no error");
});

app.get("/api/getlist", async (req, res, next) => {
	let listId;
	let playlist;

	try {
		listId = req.query.listId || "";
		
		if (listId) {
			playlist = await ytpl(listId);
		}
	} catch (err) {
		next(err);
		return;
	}

	res.json({
		list: playlist
	});
});



app.get("/api/img", (req, res, next) => {
	const imgURL = url.parse(req.query.url);
	http
		.request(
			{
				// head because we only care about whether it exists or not
				method: "HEAD",
				hostname: imgURL.hostname,
				path: imgURL.pathname,
				port: imgURL.port
			},
			(response) => {
				res.json({ status: response.statusCode });
			}
		)
		.on("error", (err) => {
			next(err);
		})
		.end();
});

app.get("/api/get", async (req, res, next) => {
	let data;
	let filterURL;

	try {
		data = await ytdl.getInfo(
			"https://www.youtube.com/watch?v=" + req.query.url
		);
	} catch (err) {
		next(err);
		return;
	}

	try {
		filterURL = ytdl.chooseFormat(data.formats, {
			filter: "audioonly",
			quality: "highest"
		}).url;
	} catch (err) {
		next(err);
		return;
	}
	res.json({
		data: data,
		directURL: filterURL
	});
});


app.get("/*", (req, res) => {
	res.status(403).send("absolutely not");
});

app.post("/*", (req, res) => {
	res.status(403).send("absolutely not");
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.listen(port, function () {
    console.log('Example app listening on port ' + port + '!');
  });

module.exports = app;
