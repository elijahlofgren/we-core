'use strict';

var _sanitizeHtml = require('sanitize-html');

var _sanitizeHtml2 = _interopRequireDefault(_sanitizeHtml);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Sanitizer(we) {
  this.we = we;
  var sanitizer = this;

  // after define all models add term field hooks in models how have terms
  we.hooks.on('we:models:set:joins', this.setSanitizeModelAttrs);

  /**
   * sequelize hook handler to sanitize all text fields with we sanitizer
   *
   * @param {record}    r
   * @param {options}   opts
   * @param {FuncDBBeforeUpdateAndCreateHooktion}  done
   */
  this.DBBeforeUpdateAndCreateHook = function DBBeforeUpdateAndCreateHook(r, opts, done) {
    sanitizer.sanitizeModelAttrs(r, this.name);
    done(null, r);
  };
}

/**
 * Set sanitizer in before create and update model hooks
 *
 * @param {Object}   we   we.js object
 * @param {Function} done callback
 */
/**
 * We.js sanitizer to sanitize model and text variable data
 *
 */
Sanitizer.prototype.setSanitizeModelAttrs = function setSanitizeModelAttrs(we, done) {
  var models = we.db.models;
  var sanitizer = we.sanitizer;

  for (var modelName in models) {
    // set sanitizer hook
    models[modelName].addHook('beforeCreate', 'sanitizeBeforeSv', sanitizer.DBBeforeUpdateAndCreateHook);
    models[modelName].addHook('beforeUpdate', 'sanitizeBeforeUP', sanitizer.DBBeforeUpdateAndCreateHook);
  }

  done();
};

/**
 * Sanitize one text html
 * @param  {String} dirty html to sanitize
 * @return {String}       sanitized html
 */
Sanitizer.prototype.sanitize = function sanitize(dirty) {
  return (0, _sanitizeHtml2.default)(dirty, this.we.config.security.sanitizer);
};

/**
 * Sanitize all text attrs in one object
 *
 * @param  {Object} obj sanitize obj attrs
 * @return {Object}     return obj
 */
Sanitizer.prototype.sanitizeAllAttr = function sanitizeAllAttr(obj) {
  for (var prop in obj) {

    if (prop !== 'id') {
      if (typeof obj[prop] == 'string') {
        obj[prop] = this.sanitize(obj[prop]);
      }
    }
  }
  return obj;
};

/**
 * Sanitize all sequelize text record attrs
 *
 * @param  {Object} record     sequelize record to sanitize
 * @param  {String} modelName  model name
 * @return {Object}            return obj
 */
Sanitizer.prototype.sanitizeModelAttrs = function sanitizeModelAttrs(record, modelName) {
  var db = this.we.db;

  for (var prop in record.dataValues) {
    if (prop !== 'id') {
      if (typeof record.dataValues[prop] == 'string') {
        // if dont have value
        if (!record.getDataValue(prop)) continue;
        // check skip cfg, skipSanitizer
        if (!db.modelsConfigs[modelName] || !db.modelsConfigs[modelName].definition[prop] || db.modelsConfigs[modelName].definition[prop].skipSanitizer) {
          continue;
        }
        // sanitize this value
        record.setDataValue(prop, this.sanitize(record.getDataValue(prop)));
      }
    }
  }
  return record;
};

module.exports = Sanitizer;