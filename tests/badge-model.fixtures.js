const fs = require('fs');
const Issuer = require('../models/issuer');
const User = require('../models/user');
const BadgeInstance = require('../models/badge-instance');
const Badge = require('../models/badge');
const test = require('./');

const IMAGE = test.asset('sample.png');

const ISSUER = new Issuer({
    name: 'Badge Authority',
    org: 'Some Org',
    contact: 'brian@example.org'
});

module.exports = {
  'issuer': ISSUER,
  'link-basic': new Badge({
    name: 'Link Badge, basic',
    shortname: 'link-basic',
    description: 'For doing links.',
    image: IMAGE,
    issuer: ISSUER,
    issuer: ISSUER,
    behaviors: [
      { shortname: 'link', count: 5 }
    ]
  }),
  'link-advanced': new Badge({
    name : 'Link Badge, advanced',
    shortname: 'link-advanced',
    description: 'For doing lots of links.',
    image: IMAGE,
    issuer: ISSUER,
    behaviors: [
      { shortname: 'link', count: 10 }
    ]
  }),
  'comment': new Badge({
    name : 'Commenting badge',
    shortname: 'comment',
    description: 'For doing lots of comments.',
    image: IMAGE,
    issuer: ISSUER,
    behaviors: [
      { shortname: 'comment', count: 5 }
    ]
  }),
  'link-comment': new Badge({
    name : 'Linking and commenting badge',
    shortname: 'link-comment',
    description: 'For doing lots of comments and links',
    image: IMAGE,
    issuer: ISSUER,
    behaviors: [
      { shortname: 'comment', count: 5 },
      { shortname: 'link', count: 5 }
    ]
  }),
  'offline-badge': new Badge({
    name: 'Offline badge',
    shortname: 'offline-badge',
    description: 'For doing stuff offline',
    image: IMAGE,
    issuer: ISSUER,
    claimCodes: [
      { code: 'already-claimed', claimedBy: 'brian@example.org' },
      { code: 'never-claim' },
      { code: 'will-claim' },
      { code: 'remove-claim' }
    ]
  }),
  'other-offline-badge': new Badge({
    name: 'Other Offline badge',
    shortname: 'other-offline-badge',
    description: 'For doing more offline stuff',
    image: IMAGE,
    issuer: ISSUER,
    claimCodes: [
      { code: 'slothstronaut' },
      { code: 'bearstronaut' },
      { code: 'catstronaut' }
    ]
  }),
  'random-badge': new Badge({
    name: 'Random code badge',
    shortname: 'random-badge',
    description: 'For doing random stuff',
    image: IMAGE,
    issuer: ISSUER,
    claimCodes: []
  }),
  'user': new User({
    user: 'brian@example.org',
    credit: {}
  }),
  'instance': new BadgeInstance({
    user: 'brian@example.org',
    hash: 'hash',
    badge: 'link-basic',
    assertion: '{ "assertion" : "yep" }',
    seen: true
  })
};

