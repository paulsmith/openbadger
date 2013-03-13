var Issuer = require('../models/issuer');

exports.create = function(req, res) {
  var form = req.body;
  var issuer = new Issuer({
    name: form.name,
    org: form.org,
    contact: form.contact,
    jwtSecret: form.secret
  });
  issuer.save(function(err, result) {
    if (err) return res.send(err);
    req.flash('info', 'Issuer ' + issuer.name + ' created');
    res.redirect('/');
  });
};

exports.update = function(req, res) {
  var form = req.body;
  var issuer = req.issuer;
  issuer.name = form.name;
  issuer.org = form.org;
  issuer.contact = form.contact;
  issuer.jwtSecret = form.secret;
  issuer.save(function (err, result) {
    if (err) return res.send(err);
    req.flash('info', 'Issuer ' + issuer.name + ' updated');
    res.redirect('/');
  });
};

// Middleware that populates a `issuers' array property on the request object
exports.findAll = function() {
  return function(req, res, next) {
    Issuer.find(function (err, issuers) {
      if (err) return next(err);
      req.issuers = issuers;
      next();
    });
  };
};

exports.findByShortName = function(req, res, next) {
  Issuer.findOne({shortname: req.params.shortname})
    .populate('badges')
    .exec(function(err, result) {
      if (err) return next(err);
      req.issuer = result;
      next();
    });
};
