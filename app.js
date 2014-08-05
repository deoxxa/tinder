#!/usr/bin/env node

var facebookToken = process.argv[2];

if(!facebookToken) {
  console.error("./app.js <facebookToken>");
  process.exit(1);
}

var Tinder = require("./index");

var tinder = new Tinder({
  facebookToken: facebookToken,
});

tinder.on("error", console.trace);

tinder.on("data", function(recommendation) {
  console.log("[%s] liking user %s (%s)", new Date().toISOString(), recommendation._id, recommendation.name);

  tinder.likeUser(recommendation._id, function(err, res) {

    if (err) {
      if(~err.indexOf('429')) {
        return console.error("[%s] Too many requests, skipping like.", new Date().toISOString());
      }
      return console.trace(err);
    }

    if (!res) {
      return console.trace(Error("no response???"));
    }

    if (res && res.match) {
      console.log("[%s] matched with user %s (%s)", new Date().toISOString(), recommendation._id, recommendation.name);
    }
  });
});

tinder.on("idle", function() {
  console.log("[%s] now idle, will wait a minute", new Date().toISOString());

  setTimeout(function() {
    tinder.beginPolling();
  }, 60 * 1000);
});

tinder.authenticate(function(err, res) {
  if (err) {
    return console.trace(err);
  }

  console.log("[%s] logged in as user %s (%s)", new Date().toISOString(), res.user.full_name, res.user._id);
  tinder.beginPolling();

});
