var restify = require('restify'),
    userSave = require('save')('user'),
    statSave = require('save')('stat'),
    fs = require('fs'),
    path = require('path');

var server = restify.createServer({name:'stats-api'});

server.use(restify.fullResponse());
server.use(restify.bodyParser());

server.listen(3000, function(){
	console.log('%s listening at %s', server.name, server.url);
});

var handleError = function(error){
	if(error){
		return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)));
	}else{
		return undefined;
	}
};

//Stats endpoints
server.get('/stat/:name', function(req, res, next){
    statSave.findOne({name:req.params.name}, function(err, stat){
	var error = handleError(err);
	if(error) return error;

	if(stat){
		res.send(stat);
	}else{
		res.send(404);
   	}
    });
});

server.post('/stat/:action/:name/:count', function(req, res, next){
	statSave.findOne({name:req.params.name}, function(err, stat){
		var error = handleError(err);
		if(error) return error;
		var action = req.params.action;
		var count = parseInt(req.params.count);
		var countAdjust = action === 'less' ? (-1*count) : count;	
		if(stat){
			var newCount = stat.count + countAdjust;
			statSave.update({_id:stat._id, name:req.params.name, count:newCount}, function(error, stat){
				var uErr = handleError(error);
				if(uErr) return uErr;

				res.send(stat);	
			});
		}else{
			statSave.create({name:req.params.name, count:countAdjust}, function(createErr, newStat){
				var cErr = handleError(createErr);
				if(cErr) return cErr;
				
				res.send(201, newStat);
			});	
		}
	});
});

//Get all Users
server.get('/user', function (req, res, next) {
  userSave.find({}, function (error, users) {
    res.send(users);
  });
});

//Get User By Id
server.get('/user/:id', function(req, res, next){
  userSave.findOne({_id:req.params.id}, function(error, user){
	if(error){
		return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)));
	}

	if(user){
		res.send(user);
	}else{
		res.send(404);
	}
  });
});

//Create User
server.post('/user', function (req, res, next) {
  if (req.params.name === undefined) {
    return next(new restify.InvalidArgumentError('Name must be supplied'));
  }

  var filePath = path.join(__dirname, 'data/users.csv');
  console.log("filepath: %s", filePath);
  fs.writeFile(filePath, req.params.name, function(error){
	if(error){
		throw error;
	}
	console.log("User saved with name: " + req.params.name);
  });

  //Create a user 
  userSave.create({ name: req.params.name }, function (error, user) {
    if (error){
	 return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)));
    }
 
    res.send(201, user);
  });
});

//Update User
server.put('/user/:id', function (req, res, next) {
  if (req.params.name === undefined) {
    return next(new restify.InvalidArgumentError('Name must be supplied'));
  }
 
  userSave.update({ _id: req.params.id, name: req.params.name }, function (error, user) {
    if (error){
	 return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)));
    }

    res.send();
  });
});

//Delete User
server.del('/user/:id', function(req, res, next) {
	userSave.delete(req.params.id, function(error, user) {
		if(error){
			return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)));
		}

		res.send();
	});
});
