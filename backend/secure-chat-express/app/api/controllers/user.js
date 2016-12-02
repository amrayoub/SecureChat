"use strict";

var mongoose = require('mongoose');

var User = mongoose.model('User');
const crypto = require('crypto');
const hash = crypto.createHash('sha1');
const words = require('../../wordJson/wordData');

// Controller logic for searching a user based on a query string.
module.exports.findUserByQuery = function(req, res) {
    // Check if the user was authenticated
    if (req.user) {
        // set queryString variable to be from the requested query string.
        var queryString = req.query.queryString;
        // Check if queryString was provided
        if (!queryString) {
          res.status(400).json({'error': 'queryString required in query'});
          return;
        }
        // search based on the queryString provided
        User.search(queryString, function(err, result) {
            if (err) {
              // if there was an error respond with status 500
              // and the err information.
              res.status(500).json(err);
            } else if (!result || result.length === 0) {
              // if the result wasn't found respond with status 404
              // and the information stating results were not found.
              res.status(404).json({'error' : 'No Results Found.'});
            } else {
              // the results were found and responding with it as a list of
              // json object.
              res.status(200).json(result);
            }
          });
        } else {
        // Respond with Unauthorized access.
        res.status(401).json({'error': 'Access Not Authorized.'});
    }
};

// Controller logic for finding a user by their facebook Id
module.exports.findUserById = function(req, res) {
    // Check if the user was authenticated
    if (req.user) {
        var facebookID = req.params.id;

        // check if the id was passed in the parameter.
        if (!facebookID) {
            res.status(404).json({'error': 'ID is required to find user.'});
            return;
        }

        // Find the user based on their facebookID and return the data
        // stored in the database.
        User.findOne({'facebook.id' : facebookID}, function(err, user) {
            if (!user) {
                // if the user wasn't found respond with status 404
                // and the information stating User was not found.
                res.status(404).json({'error': 'User was not found.'});
            } else if (err) {
                // if there was an error respond with status 500
                // and the err information.
                res.status(500).json(err);
            } else {
                // if there wasn't an error and the user was found.
                // respond with status 200 and user's information
                res.status(200).json(user);
            }
        });
    } else {
        // Respond with Unauthorized access.
        res.status(401).json({'error': 'Access Not Authorized.'});
    }
};

module.exports.getFriend = function(req, res) {
    if (req.user) {
        if (req.user.friends.length <= 0) {
            res.status(404).json({'error' : 'No friends found for user'});
        }
        var friends = [];
        var count = 0;
        // for each friend for the given user add it to the friends array
        // if the friend was found.
        req.user.friends.forEach(function(friendId) {
            User.findOne({'facebook.id' : friendId}, function(err, friend) {
                if (err) {
                    // error finding friend.
                    res.status(500).json(err);
                } else if (friend) {
                    count++; // keep track of the number of friends found.
                    friends.push(friend);
                }
            }).then(function() {
                // respond with the friends array after the loop has finished running.
                if (count === req.user.friends.length) {
                    res.status(200).json(friends);
                }
            });
        });
    } else {
        // Respond with Unauthorized access.
        res.status(401).json({'error': 'Access Not Authorized.'});
    }
};

module.exports.putPublicKey = function(req, res) {
    // Check if the user was authenticated
    if (req.user) {
        var thisUser = req.user;
        var publicKey = req.body.publicKey;
        // check if the publicKey was sent through the body.
        if (!publicKey) {
            res.status(400).json({'error' : 'publicKey required in body.'});
            return;
        }
        // update the hash with the given publicKey
        hash.update(publicKey);
        // splits every 1-2 characters into a hex digest.
        var digests = hash.digest('hex').toUpperCase().match(/.{1,2}/g);
        // creates the readable key.
        for (var i = 0; i < digests.length; i++) {
            digests[i] = words[digests[i]];
        }
        // sets the public and readable key.
        thisUser.publicKey.keys.pgp = publicKey;
        thisUser.publicKey.keys.readable = digests.join(" ");
        thisUser.save(function(err, user) {
            if (err) {
                res.status(500).json(err);
            } else {
                res.status(201).json(user);
            }
        });
    } else {
        // Respond with Unauthorized access.
        res.status(401).json({'error': 'Access Not Authorized.'});
    }
};

module.exports.getPublicKey = function(req, res) {
    //  Check if the user was authenticated
    if (req.user) {
        var otherUserId = req.params.id;
        if (!otherUserId) {
            res.status(400).json({'error': 'OtherUserID required in parameter.'});
            return;
        }
        // Find a user based on the queried id.
        User.findOne({'facebook.id': otherUserId}, function(err, user) {
            var publicKey = user.publicKey.keys.pgp;
            if (err) {
                res.status(500).json(err);
            } else if (!publicKey) {
                res.status(404).json({'error' : 'Public key not set for the queried user.'});
            } else {
                // update the hash with their publickey
                hash.update(publicKey);
                var digests = hash.digest('hex').toUpperCase().match(/.{1,2}/g);
                for (var i = 0; i < digests.length; i++) {
                    digests[i] = words[digests[i]];
                }
                // respond with the readable and pgp key
                res.status(200).json(
                    {
                        'publicKey' : publicKey,
                        'readableKey' : digests.join(" ")
                    }
                );
            }
        });
    } else {
        // Respond with Unauthorized access.
        res.status(401).json({'error': 'Access Not Authorized.'});
    }
}
