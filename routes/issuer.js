var Issuer = require('../models/issuer');

exports.update = function update(req, res) {
  var form = req.body;
  var issuer = req.issuer || new Issuer();
  issuer.name = form.name;
  issuer.org = form.org;
  issuer.contact = form.contact;
  issuer.jwtSecret = form.secret;
  issuer.save(function (err, result) {
    if (err)
      return res.send(err);
    req.flash('info', 'Configuration saved');
    res.redirect('/');
  });
};

// Middleware that populates a `issuers' array property on the request object
exports.findAll = function() {
  return function(req, res, next) {
    Issuer.find(function (err, issuers) {
      if (err) return next(err);
      req.issuers = issuers;
      console.log(issuers);
      next();
    });
  };
};
