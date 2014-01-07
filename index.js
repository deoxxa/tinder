var request = require("request"),
    stream = require("stream");

var Tinder = module.exports = function Tinder(options) {
  options = options || {};

  options.objectMode = true;

  stream.Readable.call(this, options);

  this.token = options.token || null;
  this.rootUrl = options.rootUrl || "https://api.gotinder.com";

  this.request = request.defaults({
    headers: {
      "authorization": "Token token=\"" + this.token + "\"",
      "x-auth-token": this.token,
      "user-agent": "Tinder/3.0.2 (iPhone; iOS 7.0.4; Scale/2.00)",
    },
    json: true,
  });
};
Tinder.prototype = Object.create(stream.Readable.prototype, {constructor: {value: Tinder}});

Tinder.prototype._read = function _read(n) {};

Tinder.prototype.getMyProfile = function getMyProfile(cb) {
  this.request(this.rootUrl + "/profile", function(err, res, data) {
    if (res.statusCode !== 200) {
      return cb(Error("invalid status; expected 200 but got " + res.statusCode));
    }

    return cb(err, data);
  });
};

Tinder.prototype.getRecommendations = function getRecommendations(cb) {
  this.request(this.rootUrl + "/user/recs", function(err, res, data) {
    if (res.statusCode !== 200) {
      return cb(Error("invalid status; expected 200 but got " + res.statusCode));
    }

    return cb(err, data);
  });
};

Tinder.prototype.getUser = function getUser(id, cb) {
  this.request(this.rootUrl + "/user/" + id, function(err, res, data) {
    if (res.statusCode !== 200) {
      return cb(Error("invalid status; expected 200 but got " + res.statusCode));
    }

    return cb(err, data);
  });
};

Tinder.prototype.likeUser = function likeUser(id, cb) {
  this.request(this.rootUrl + "/like/" + id, function(err, res, data) {
    if (res.statusCode !== 200) {
      return cb(Error("invalid status; expected 200 but got " + res.statusCode));
    }

    return cb(err, data);
  });
};

Tinder.prototype.setLocation = function setLocation(options, cb) {
  var config = {
    method: "POST",
    uri: this.rootUrl + "/ping",
    json: options,
  };

  this.request(config, function(err, res, data) {
    if (res.statusCode !== 200) {
      return cb(Error("invalid status; expected 200 but got " + res.statusCode));
    }

    return cb(err, data);
  });
};

Tinder.prototype.pollRecommendations = function pollRecommendations(done) {
  var self = this;

  if (!done) {
    done = function done(err) { if (err) { throw err; } };
  }

  this.getRecommendations(function(err, res) {
    if (err) {
      return done(err);
    }

    if (!res) {
      return done(Error("invalid (missing?) response"));
    }

    if (res.message && res.message === "recs exhausted") {
      return done(null, true);
    }

    if (res.message && res.message === "recs timeout") {
      return done(null, true);
    }

    if (!res.status || res.status !== 200) {
      return done(Error("invalid status; expected 200 but got " + res.status));
    }

    if (!Array.isArray(res.results)) {
      return done(Error("results wasn't an array"));
    }

    for (var i=0;i<res.results.length;++i) {
      if (res.results[i]) {
        self.push(res.results[i]);
      }
    }

    return done(null, false);
  });
};

Tinder.prototype.beginPolling = function beginPolling() {
  var self = this;

  var poll = function poll() {
    self.pollRecommendations(function(err, stopPolling) {
      if (err) {
        return self.emit("error", err);
      }

      if (stopPolling) {
        return self.emit("idle");
      }

      poll();
    });
  };

  poll();

  return this;
};
