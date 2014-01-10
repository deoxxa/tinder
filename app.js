#!/usr/bin/env node

var Tinder = require("./index");

var tinder = new Tinder({
  facebookId: "YOUR_FACEBOOK_ID",
  facebookToken: "YOUR_FACEBOOK_TOKEN",
});

tinder.on("error", console.trace);

tinder.on("data", function(recommendation) {
  console.log("[%s] liking user %s (%s)", new Date().toISOString(), recommendation._id, recommendation.name);

  tinder.likeUser(recommendation._id, function(err, res) {
    if (err) {
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

  console.log(JSON.stringify(res, null, 2));

  tinder.beginPolling();
});
