var express = require('express');
var app = express();
app.set('view engine', 'jade');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/hw8');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open',function(callback){
	console.log("success!");
});

var shorthost = 'localhost:3000/';

//url schema would keep track of the paired link as well as counts.
var urlSchema = mongoose.Schema({
	longLink: String,
	shortLink: String,
	count: Number, default: 0
});

//create a model for input and url schema
var urlModel = mongoose.model('urlModel',urlSchema);

//creates a shortened link
function createNewUrl(){
	// Random base 36 string
	var shortRoute =	Math.floor((Math.random() * (1000000000-1000)) + 1000).toString(36);

	return shorthost + shortRoute;
};

//check if user input is one a shortened link
function isShort(url) {
	if(url.substring(0,shorthost.length) === shorthost)
	{
		return true;
	} else {
		return false;
	}
};

var topten = null;
urlModel.find().sort({count: -1}).limit(10).exec(function(err, topurls){
	if(err) console.log(err);
	topten = topurls;
});


app.get('/', function(req, res) { 
	console.log(topten);
	res.render('index', {'topten':topten});
});

app.get('/:id?', function(req, res) {
	var id = req.params.id;
	urlModel.findOne({'shortLink': shorthost + id}, function(err, reply) {
		if(err) console.log(err);

		if(reply != null) {
			// updating count
			// http://stackoverflow.com/questions/7267102/how-do-i-update-upsert-a-document-in-mongoose
			var upsertData = reply.toObject();
			
			upsertData.count = reply.count + 1;
			delete upsertData._id;
			
			urlModel.update({_id: reply.id}, upsertData, {upsert: true}, function(err) {
				console.log(err);
			});
		
			res.redirect('http://' + reply.longLink);
		} else { 
			res.status(404).send('404: Page not found.');
		}
	});
});

app.post('/', function(req, res) {
	var url = req.body.url;

	if(isShort(url)) {
		urlModel.findOne({'shortLink': url}, 'longLink count', function(err, reply) {
			if(err) console.log(err);
			
			// Case #1: url is short and it exist.  Redirect the user to long url.
			if(reply != null) {
				res.redirect('http://' + reply.longLink);
			} else { // Case #2: url is short however it does not exist  
				res.render('index', { 'message': 'The shorten address ' + url + ' does not exist.', 'topten':topten});
			}
		});
		
	} else {
		urlModel.findOne({'longLink': url}, 'shortLink', function(err, reply) {
			if(err) console.log(err);
			
			// Case #3: The url is long and is already shorten.  Display the short url.
			if(reply != null) {
				res.render('index', { 'message': reply.shortLink, 'topten':topten });
			} else { // Case #4: The url is long and has not been shorten. Shorten the url then display the shorten url.
				var shorturl = createNewUrl();
			
				var newUrl = new urlModel({longLink: url, shortLink: shorturl, count:1});
				newUrl.save(function(err){
					if (err !== null){
						//object was not saved!
						console.log(err);
					}else{
						console.log("url saved");
					}
				})
				res.render('index', { 'message': shorturl, 'topten':topten});
			}
		});
	}
});


var server = app.listen(3000, function() {
	console.log('Listening on port 3000');
});
