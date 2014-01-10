var request = require("request"),
    stream = require("readable-stream");

var Tinder = module.exports = function Tinder(options) {
  options = options || {};

  options.objectMode = true;

  stream.Readable.call(this, options);

  this.facebookId = options.facebookId || null;
  this.facebookToken = options.facebookToken || null;
  this.token = options.token || null;
  this.rootUrl = options.rootUrl || "https://api.gotinder.com";

  var self = this;
  this.request = request.defaults({
    json: true,
    headers: Object.create(null, {
      "authorization": {
        get: function get() { return "Token token=\"" + self.token + "\""; },
        enumerable: true,
      },
      "x-auth-token": {
        get: function get() { return self.token; },
        enumerable: true,
      },
    }),
  });
};
Tinder.prototype = Object.create(stream.Readable.prototype, {constructor: {value: Tinder}});

Tinder.prototype._read = function _read(n) {};

Tinder.prototype.authenticate = function authenticate(options, cb) {
  if (typeof options === "function") {
    cb = options;
    options = null;
  }

  options = options || {};

  if ((!options.facebookId && !this.facebookId) || (!options.facebookToken && !this.facebookToken)) {
    return cb(Error("facebookId and facebookToken parameters are required"));
  }

  var config = {
    method: "POST",
    uri: this.rootUrl + "/auth",
    json: {
      facebook_id: options.facebookId || this.facebookId,
      facebook_token: options.facebookToken || this.facebookToken,
    },
  };

  var self = this;
  this.request(config, function(err, res, data) {
    if (err) {
      return cb(err);
    }

    if (res.statusCode !== 200) {
      return cb(Error("invalid status; expected 200 but got " + res.statusCode));
    }

    if (!data.token) {
      return cb(Error("no token found in response, probably unsuccessful"));
    }

    self.token = data.token;

    return cb(err, data);
  });
};

Tinder.prototype.getMyProfile = function getMyProfile(cb) {
  this.request(this.rootUrl + "/profile", function(err, res, data) {
    if (err) {
      return cb(err);
    }

    if (res.statusCode !== 200) {
      return cb(Error("invalid status; expected 200 but got " + res.statusCode));
    }

    return cb(err, data);
  });
};

Tinder.prototype.getRecommendations = function getRecommendations(cb) {
  this.request(this.rootUrl + "/user/recs", function(err, res, data) {
    if (err) {
      return cb(err);
    }

    if (res.statusCode !== 200) {
      return cb(Error("invalid status; expected 200 but got " + res.statusCode));
    }

    return cb(err, data);
  });
};

Tinder.prototype.getUpdates = function getUpdates(cb) {
  var config = {
    uri: this.rootUrl + "/updates",
    json: {
      last_activity_date: new Date().toISOString(),
    },
  };

  this.request.post(config, function(err, res, data) {
    if (err) {
      return cb(err);
    }

    if (res.statusCode !== 200) {
      return cb(Error("invalid status; expected 200 but got " + res.statusCode));
    }

    return cb(err, data);
  });
};

Tinder.prototype.getUser = function getUser(id, cb) {
  this.request(this.rootUrl + "/user/" + id, function(err, res, data) {
    if (err) {
      return cb(err);
    }

    if (res.statusCode !== 200) {
      return cb(Error("invalid status; expected 200 but got " + res.statusCode));
    }

    return cb(err, data);
  });
};

Tinder.prototype.getMatch = function getMatch(id, cb) {
  this.request(this.rootUrl + "/user/matches/" + id, function(err, res, data) {
    if (err) {
      return cb(err);
    }

    if (res.statusCode !== 200) {
      return cb(Error("invalid status; expected 200 but got " + res.statusCode));
    }

    return cb(err, data);
  });
};

Tinder.prototype.sendMessage = function sendMessage(matchId, message, cb) {
  var config = {
    uri: this.rootUrl + "/user/matches/" + matchId,
    json: {
      message: message,
    },
  };

  this.request.post(config, function(err, res, data) {
    if (err) {
      return cb(err);
    }

    if (res.statusCode !== 200) {
      return cb(Error("invalid status; expected 200 but got " + res.statusCode));
    }

    return cb(err, data);
  });
};

Tinder.prototype.likeUser = function likeUser(id, cb) {
  this.request(this.rootUrl + "/like/" + id, function(err, res, data) {
    if (err) {
      return cb(err);
    }

    if (res.statusCode !== 200) {
      return cb(Error("invalid status; expected 200 but got " + res.statusCode));
    }

    return cb(err, data);
  });
};

Tinder.prototype.setLocation = function setLocation(options, cb) {
  var config = {
    uri: this.rootUrl + "/ping",
    json: {
      lat: options.latitude,
      lon: options.longitude,
    },
  };

  this.request.post(config, function(err, res, data) {
    if (err) {
      return cb(err);
    }

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
