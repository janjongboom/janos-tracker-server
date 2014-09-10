/**
 * A bunch of helper methods that we don't want to clutter push-server.js
 */
module.exports = {
  allowCors: function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
  }
};
