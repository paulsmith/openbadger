var test = require('./');
var env = require('../lib/environment');
var db = require('../models');
var Issuer = require('../models/issuer');

function validIssuer() {
  return new Issuer({
    name: 'Some Issuer',
    org: 'Some Organization',
    contact: 'badges@example.org'
  });
}

var badgeFixtures = require('./badge-model.fixtures.js');

test.applyFixtures({
  'testIssuer': new Issuer({
    name: 'Mozilla',
    org: 'Webmaker',
    contact: 'brian@mozillafoundation.org'
  }),
  'testBadge': badgeFixtures['link-basic']
}, function (fixtures) {
  test('Issuer#validate: everything is cool', function (t) {
    var issuer = validIssuer();
    issuer.validate(function (err) {
      t.notOk(err, 'should not have any errors');
      t.end();
    });
  });

  test('Issuer#validate: bad contact', function (t) {
    var issuer = validIssuer();
    issuer.contact = 'not an email address'
    issuer.validate(function (err) {
      var error;
      t.ok(err, 'should have errors');
      error = err.errors.contact;
      t.ok(error, 'should have a contact error');
      t.same(error.type, 'regexp', 'should be a regexp error');
      t.end();
    });
  });

  test('Issuer.findOne: works as expected, has default jwtSecret', function (t) {
    var expect = fixtures['testIssuer'];
    Issuer.findOne(function (err, result) {
      t.same(expect.id, result.id, 'should be the expected issuer');
      t.same(expect.jwtSecret.length, 64, 'should generate a random 64 character secret');
      t.end();
    });
  });

  test('Issuer.getAssertionObject', function (t) {
    env.temp({ origin: 'http://example.org' }, function (resetEnv) {
      var expect = {
        name: 'Mozilla',
        org: 'Webmaker',
        contact: 'brian@mozillafoundation.org',
        origin: 'http://example.org',
      };
      Issuer.getAssertionObject(function (err, result) {
        t.same(result, expect);
        resetEnv();
        t.end();
      })
    });
  });

  test('Issuer.populate: populates (empty) array of badges', function(t) {
    Issuer
      .findOne()
      .populate('badges')
      .exec(function(err, issuer) {
        t.notOk(err, 'should not have any errors');
        t.same(issuer.badges.length, 0, 'should be an empty array');
        t.end();
      });
  });

  test('Issuer.populate: saves & populates array of badges', function(t) {
    var badge = fixtures['testBadge'];
    var issuer = fixtures['testIssuer'];
    t.equal(issuer.badges.length, 0, 'badges array should initially be empty');
    badge.save(function(err) {
      issuer.badges.push(badge);
      issuer.save(function(err) {
        Issuer
          .findOne()
          .populate('badges')
          .exec(function(err, i) {
            t.equal(i.badges.length, 1, 'badges array should increase by 1');
            t.equal(i.badges[0].id, badge.id, 'should be badge saved as child');
            t.end();
          });
      });
    });
  });

  // necessary to stop the test runner
  test('shutting down #', function (t) {
    db.close();
    t.end();
  });

});
