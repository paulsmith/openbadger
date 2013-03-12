const test = require('./');
const env = require('../lib/environment');
const util = require('../lib/util');
const db = require('../models');
const Badge = require('../models/badge');

function validBadge() {
  return new Badge({
    shortname: 'badge-name',
    name: 'badge name',
    description: 'badge description',
    behaviors: [],
    prerequisites: [],
    image: test.asset('sample.png'),
    issuer: fixtures.issuer
  });
}

var fixtures = require('./badge-model.fixtures.js');
test.applyFixtures(fixtures, function () {
  test('Badge#imageDataURI', function (t) {
    var badge = new Badge({image: test.asset('sample.png')});
    var dataURI = badge.imageDataURI();
    t.ok(dataURI.match(/^data:image\/png;base64,.+$/), 'should match data uri format');
    t.end();
  });

  test('Badge#save: saving a valid badge', function (t) {
    var expect = validBadge();
    expect.save(function (err) {
      t.notOk(err, 'should not have an error when saving');
      Badge.findById(expect.id, function (err, result) {
        t.notOk(err, 'should not have an error when finding');
        t.ok(result.image, 'should have an image');
        t.same(result.image, expect.image);
        t.ok(result.issuer, 'should have an issuer');
        t.same(result.issuer, expect.issuer);
        t.end();
      });
    });
  });

  test('Badge#validate: image too big', function (t) {
    var errorKeys;
    var badge = validBadge();
    var length = 257 * 1024
    badge.image = Buffer(length);
    badge.validate(function (err) {
      t.ok(err, 'should have errors');
      errorKeys = Object.keys(err.errors);
      t.same(errorKeys, ['image'], 'should only have one error');
      t.same(err.errors['image'].type, 'maxLength', 'should be a maxLength error');
      t.end();
    });
  });

  test('Badge#validate: name too long', function (t) {
    var errorKeys;
    var length = 128;
    var badge = validBadge();
    badge.name = test.randomstring(length + 1);
    badge.validate(function (err, results) {
      t.ok(err, 'should have errors');
      errorKeys = Object.keys(err.errors);
      t.same(errorKeys, ['name'], 'should only have one error');
      t.same(err.errors['name'].type, 'maxLength', 'should be a maxLength error');
      t.end();
    });
  });

  test('Badge#validate: description too long', function (t) {
    var errorKeys;
    var length = 128;
    var badge = validBadge();
    badge.description = test.randomstring(length + 1);
    badge.validate(function (err, results) {
      t.ok(err, 'should have errors');
      errorKeys = Object.keys(err.errors);
      t.same(errorKeys, ['description'], 'should only have one error');
      t.same(err.errors['description'].type, 'maxLength', 'should be a maxLength error');
      t.end();
    });
  });

  test('Badge.findByBehavior: finding badges by behavior', function (t) {
    var behavior = 'link';
    Badge.findByBehavior(behavior, function (err, badges) {
      var expectIds = [
        fixtures['link-basic'].id,
        fixtures['link-advanced'].id,
        fixtures['link-comment'].id
      ].sort();
      var actualIds = badges.map(function (o) { return o.id }).sort();
      t.same(actualIds, expectIds, 'should get just the `link` badges back');
      t.end();
    });
  });

  test('Badge.findByBehavior: finding badges by multiple behaviors', function (t) {
    var behaviors = ['link', 'comment'];
    Badge.findByBehavior(behaviors, function (err, badges) {
      var expectIds = [
        fixtures['link-basic'].id,
        fixtures['link-advanced'].id,
        fixtures['link-comment'].id,
        fixtures['comment'].id,
      ].sort();
      var actualIds = badges.map(function (o) { return o.id }).sort();
      t.same(actualIds, expectIds, 'should get link and comment badges back');
      t.end();
    });
  });

  test('Badge#earnableBy: should have enough', function (t) {
    var badge = fixtures['link-comment'];
    var user = { credit: { link: 10, comment: 10 }};
    var expect = true;
    var result = badge.earnableBy(user);
    t.same(expect, result);
    t.end();
  });

  test('Badge#earnableBy: not enough', function (t) {
    var badge = fixtures['link-comment'];
    var user = { credit: { link: 10 }}
    var expect = false;
    var result = badge.earnableBy(user);
    t.same(expect, result);
    t.end();
  });

  test('Badge#award: award a badge to a user', function (t) {
    var badge = fixtures['link-comment'];
    var email = fixtures['user'].user;
    badge.award(email, function (err, instance) {
      t.notOk(err, 'should not have an error');
      t.ok(instance, 'should have a badge instance');
      t.same(instance.user, email, 'should be assigned to the right user');
      badge.award(email, function (err, instance) {
        t.notOk(err, 'should not have an error');
        t.notOk(instance, 'should not have an instance');
        t.end();
      });
    });
  });

  test('Badge#creditsUntilAward: see how many credits remain until user gets badge', function (t) {
    var badge = fixtures['link-comment'];
    var user = { credit: { link: 26 }}
    var expect = { comment: 5 };
    var result = badge.creditsUntilAward(user);
    t.same(result, expect);
    t.end();
  });

  test('Badge default: shortname', function (t) {
    var badge = new Badge({
      name: 'An   awesome badge!',
      description: 'some sorta badge',
    })
    badge.save(function (err, result) {
      t.same(badge.shortname, 'an-awesome-badge', 'should slugify if shortname is not provided');
      t.end();
    });
  });

  test('Badge: finding one by id', function (t) {
    var expect = fixtures['link-basic'];
    Badge.findById(expect.id, function (err, badge) {
      t.notOk(err, 'should not have an error');
      t.same(expect.id, badge.id, 'should get the right badge');
      t.end();
    });
  });

  test('Badge.getAll: get all the badges keyed by shortname', function (t) {
    var name = 'link-basic';
    var expect = fixtures[name];
    Badge.getAll(function (err, badges) {
      t.notOk(err, 'should not have any errors');
      t.ok(badges, 'should have some badges');
      t.same(badges[name].id, expect.id);
      t.end();
    });
  });


  test('Badge#removeBehavior', function (t) {
    var badge = validBadge();
    badge.behaviors = [
      { shortname: 'link', count: 10 },
      { shortname: 'comment', count: 20 }
    ];
    badge.removeBehavior('link');
    t.same(badge.behaviors.length, 1, 'should have one left');
    t.same(badge.behaviors[0].shortname, 'comment', 'should be the comment one');
    t.end();
  });

  test('Badge#makeAssertion: makes a good assertion', function (t) {
    var tempenv = { protocol: 'http', host: 'example.org', port: 80 };
    env.temp(tempenv, function (resetEnv) {
      var badge = fixtures['comment'];
      var issuer = fixtures['issuer'];
      var recipient = 'brian@example.org';
      var salt = 'salt';
      var expect = {
        recipient: util.sha256(recipient, salt),
        salt: salt,
        badge: {
          version: '0.5.0',
          criteria: badge.absoluteUrl('criteria'),
          image: badge.absoluteUrl('image'),
          description: badge.description,
          name: badge.name,
          issuer: {
            name: issuer.name,
            org: issuer.org,
            contact: issuer.contact,
            origin: env.origin()
          }
        }
      };
      badge.makeAssertion({
        recipient: recipient,
        salt: salt,
      }, {
        json: false
      }, function (err, result) {
        t.same(result, expect);
        resetEnv();
        t.end();
      });
    });
  });

  test('Badge.hasClaimCode', function (t) {
    const badge = fixtures['offline-badge'];
    const code = 'will-claim';
    t.same(badge.hasClaimCode(code), true);
    t.same(badge.hasClaimCode('nopeniopenope'), false);
    t.end();
  });

  test('Badge#addClaimCodes', function (t) {
    const badge = fixtures['offline-badge'];
    const codes = ['lethargic-hummingbird', 'woeful-turtle'];
    badge.addClaimCodes(codes, function (err, accepted, rejected) {
      t.notOk(err, 'should not have any errors');
      t.notOk(rejected.length, 'should not have rejected any');
      t.same(accepted, codes);

      badge.addClaimCodes(codes, function (err, accepted, rejected) {
        t.notOk(err, 'should not have any errors');
        t.notOk(accepted.length, 'should not have accepted any');
        t.same(rejected, codes);
        t.end();
      });
    });
  });

  test('Badge#addClaimCodes, filter incoming dups', function (t) {
    const badge = fixtures['offline-badge'];
    const codes = ['duplicate', 'duplicate', 'duplicate', 'duplicate', 'harrison-ford'];
    badge.addClaimCodes(codes, function (err, accepted, rejected) {
      t.notOk(err, 'should not have any errors');
      t.notOk(rejected.length, 'should not have rejected any');
      t.same(accepted, ['duplicate', 'harrison-ford']);
      t.end();
    });
  });

  test('Badge#addClaimCodes, with limit option', function (t) {
    const badge = fixtures['offline-badge'];
    const original = badge.claimCodes.length;
    const codes = ['already-claimed', 'one', 'will-claim', 'two', 'never-claim', 'three', 'four', 'five'];
    const limit = 3;
    const options = {codes: codes, limit: limit };
    badge.addClaimCodes(options, function (err, accepted, rejected) {
      t.notOk(err, 'should not have any errors');
      t.same(accepted, ['one', 'two', 'three']);
      t.same(rejected, ['already-claimed', 'will-claim', 'never-claim', 'four', 'five']);
      t.end();
    });
  });

  test('Badge#redeemClaimCode', function (t) {
    const badge = fixtures['offline-badge'];
    const code ='will-claim';
    t.same(badge.redeemClaimCode(code, 'brian@example.org'), true);
    t.same(badge.redeemClaimCode(code, 'brian@example.org'), true);
    t.same(badge.redeemClaimCode(code, 'otherguy@example.org'), false);
    t.end();
  });

  test('Badge#claimCodeIsClaimed', function (t) {
    const badge = fixtures['offline-badge'];
    const code ='already-claimed';
    t.same(badge.claimCodeIsClaimed(code), true);
    t.same(badge.claimCodeIsClaimed('never-claim'), false);
    t.same(badge.claimCodeIsClaimed('does not exist'), null);
    t.end();
  });

  test('Badge#getClaimCode', function (t) {
    const badge = fixtures['offline-badge'];
    const code = badge.getClaimCode('already-claimed');
    t.same(code.claimedBy, 'brian@example.org');
    t.end();
  });

  test('Badge.findByClaimCode', function (t) {
    const code = 'will-claim';
    Badge.findByClaimCode(code, function (err, badge) {
      t.notOk(err, 'no error');
      t.ok(badge, 'yes badge');;
      t.same(badge.shortname, 'offline-badge');
      t.end();
    });
  });

  test('Badge.getAllClaimCodes', function (t) {
    // we have six codes defined in fixtures, so we want at least that many
    var expect = 6;
    Badge.getAllClaimCodes(function (err, codes) {
      t.ok(codes.length >= expect, 'should have at least six codes');
      t.end();
    });
  });

  test('Badge#generateClaimCodes', function (t) {
    const badge = fixtures['random-badge'];
    const count = 1000;
    badge.generateClaimCodes({count: count}, function (err, codes) {
      t.notOk(err, 'should not have any errors');
      t.same(codes.length, count);
      t.same(badge.claimCodes.length, count);
      t.end();
    });
  });

  test('Badge#removeClaimCode', function (t) {
    const badge = fixtures['offline-badge'];
    badge.removeClaimCode('remove-claim');
    badge.claimCodes.forEach(function (claim) {
      if (claim.code == 'remove-claim')
        t.fail('should have removed');
    });
    t.end();
  });

  test('Badge#awardOrFind: award badge to a user', function (t) {
    var badge = fixtures['link-comment'];
    var email = fixtures['user'].user;
    badge.awardOrFind(email, function (err, instance) {
      t.notOk(err, 'should not have an error');
      t.ok(instance, 'should have a badge instance');
      t.same(instance.user, email, 'should be assigned to the right user');
      t.end();
    });
  });

  // necessary to stop the test runner
  test('shutting down #', function (t) {
    db.close();
    t.end();
  });
});
