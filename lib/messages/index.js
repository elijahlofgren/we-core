'use strict';

/**
 * Express request message strategy
 *
 * This module helps with system messages how will be send to users
 */

var messenger = {
  setFunctionsInResponse: function setFeaturesInResponse(req, res, next) {
    if (!next) next = function next() {};
    if (!res.locals.messages) res.locals.messages = [];

    /**
     * add one message in res.messages array
     *
     * @param {String} status  success, error, warning, info ... etc
     * @param {String} message message text , use one translatable string
     * @param {Object} extraData    extra data to set in message
     */
    res.addMessage = function addMessage(status, message, extraData) {
      if (status == 'error') status = 'danger';
      if (status == 'warn') status = 'warning';

      // suport for localization ... see node-i18n
      if (req.__) {
        if (typeof message != 'string') {
          message = req.__(message.text, message.vars);
        } else {
          message = req.__(message);
        }
      } else {
        // only set texts if dont have localization configured
        if (typeof message != 'string') {
          message = message.text;
        } else {
          message = message;
        }
      }

      // push messages array
      res.locals.messages.push({
        status: status,
        message: message,
        extraData: extraData || null
      });
    };

    /**
     * Get all messages
     *
     * @return {Array} messages array
     */
    res.getMessages = function getMessages() {
      var messages = [];

      if (this.locals && this.locals.messages) messages = this.locals.messages;

      // suport to flash messages
      if (this.locals.req.flash) {
        var flashMessages = this.locals.req.flash('messages');
        if (flashMessages) {
          for (var i = 0; i < flashMessages.length; i++) {
            messages.push(flashMessages[i]);
          }
        }
      }

      return messages;
    };

    /**
     * Move all locals messages to session (flash)
     *
     * This function is used in http redirects to store messages between page changes
     */
    res.moveLocalsMessagesToFlash = function moveLocalsMessagesToFlash() {
      var msgs = res.getMessages();
      if (msgs && msgs.length) req.flash('messages', msgs);
    };

    next();
  }
};

// alias
module.middleware = module.setFunctionsInResponse;

module.exports = messenger;