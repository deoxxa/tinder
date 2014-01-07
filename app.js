#!/usr/bin/env node

var Tinder = require("./index");

var tinder = new Tinder({
  token: "ADD_TOKEN",
});

tinder.on("data", function(recommendation) {
  console.log("liking user %s (%s)", recommendation._id, recommendation.name);

  tinder.likeUser(recommendation._id, function(err, res) {
    if (err) {
      return console.trace(err);
    }

    if (res && res.match) {
      console.log("matched with user %s (%s)", recommendation._id, recommendation.name);
    }
  });
});

tinder.on("idle", function() {
  console.log("now idle, will wait a minute");

  setTimeout(function() {
    tinder.beginPolling();
  }, 30 * 1000);
});

tinder.setLocation({lat: ..., lon: ...}, function(err, res) {
  if (err) {
    return console.trace(err);
  }

  console.log("location set, time to begin polling");

  return tinder.beginPolling();
});
