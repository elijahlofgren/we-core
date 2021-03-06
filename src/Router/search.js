/**
 * Route search parsers and targets
 */
var moment = require('moment');

/**
 * Converts one date string to dateTime
 * @param  {string} d date
 * @return {string}   dateTime
 */
function dateToDateTime(d) {
  var date = moment(d);
  // return null if not is valid
  if (!date.isValid()) return null;
  // return data in datetime format
  return date.format('YYYY-MM-DD HH:mm:ss');
}

module.exports = {
  parsers: {
    equalBoolean: function(searchName, field, value, w) {
      if (!value || value.toLowerCase() === 'false') {
        return w[field.target.field] =  false;
      } else {
        return w[field.target.field] =  true;
      }
    },
    equal: function(searchName, field, value, w) {
      return w[field.target.field] = value;
    },
    contains: function(searchName, field, value, w) {
      return w[field.target.field] = {
        $like : '%'+value+'%'
      }
    },
    startsWith: function(searchName, field, value, w) {
      return w[field.target.field] = {
        $like : value+'%'
      }
    },
    userSearchQuery: function(searchName, field, value, w) {
      return w.$or = {
        email: {
          $eq: value
        },
        displayName: {
          $like: value+'%'
        },
        username: {
          $eq: value
        }
      }
    },
    since: function(searchName, field, value, w) {
      if (!value) return w;

      return w[field.target.field] = {
        $gt: dateToDateTime(value)
      }
    },

    // if user from :userId is
    paramIs: function(searchName, field, value, w, req) {
      return w[field.target.field] = req.params[field.param];
    }
  },
  targets: {
    field: function(searchName, field, value, query, req) {
      req.we.router.search.parsers[field.parser](searchName, field, value, query.where, req);
    },
    association: function(searchName, field, value, query, req) {
      for (var i = 0; i < query.include.length; i++) {
        if (query.include[i]) {
          if (!query.include[i].where) query.include[i].where = {};
          req.we.router.search.parsers[field.parser](searchName, field, value, query.include[i].where, req);
          // required target configuration
          if (field.target.required) query.include[i].required = true;

          break;
        }
      }
    }
  }
}