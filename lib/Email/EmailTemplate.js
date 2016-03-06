/**
 * We.js email Class constructor
 */

var emailTemplate = require('email-templates').EmailTemplate;
var fs = require('fs');
var async = require('async');

function EmailTemplate(defaultPath, templateName) {
  var we = this.we;

  this.templatePath = defaultPath;
  this.templateName = templateName;

  // default locale
  this.defaultLocale = we.config.i18n.defaultLocale;
  // email template chache for localized emails
  this.templatesByLocale = {};
}

EmailTemplate.prototype.templatePath = '';
EmailTemplate.prototype.templateName = '';

/**
 * Email template folder cache for not localized emails
 *
 * @type {String}
 */
EmailTemplate.prototype.resolvedTemplateFolder = '';

EmailTemplate.prototype.render = function render(templateVariables, cb) {
  this.getTemplateFolder(templateVariables.locale, function (err, templateFolder) {
    if (err) return cb(err, null);

    try {
      var template = new emailTemplate( templateFolder );
        // render the template
      template.render(templateVariables, cb);
    } catch (e) {
      cb(e);
    }
  })
}

/**
 * Check if email template exists in theme email folder and  if exists override default email template
 *
 * @param  {Function}
 */
EmailTemplate.prototype.getTemplateFolder = function getTemplateFolder(locale, cb) {
  // check in localized cache
  if (this.templatesByLocale[locale])
    return cb(null, this.templatesByLocale[locale]);
  // then check in not localized cache
  if (this.resolvedTemplateFolder)
    return cb(null, this.resolvedTemplateFolder);

  var view = this.we.view;

  // if dont have this theme
  // if (!view.themes[view.appTheme])
  //   return cb(null, this.templatePath);
  var self = this;
  // check if exists a localized email template
  this.getLocalizedEmailTemplateFolder(locale, function (err, template){
    if (err || template) return cb(err, template);

    // then check if exists a not localized email template
    var themeEmailTemplateFolder = view.themes[view.appTheme].config.themeFolder + '/' +
      view.themes[view.appTheme].configs.emailTemplates.path + '/' +
      self.templateName;

    fs.readdir(themeEmailTemplateFolder, function (err, result) {
      if (err) {
        if (err.code != 'ENOENT') {
          return cb(err);
        }
      }

      if (result && result.length) {
        self.resolvedTemplateFolder = themeEmailTemplateFolder
      }

      return cb(null, self.resolvedTemplateFolder);
    });
  });
}

/**
 * Get localized email template folder
 *
 * @param  {String}   locale
 * @param  {Function} cb
 */
EmailTemplate.prototype.getLocalizedEmailTemplateFolder = function (locale, cb) {
  // locale is required to fint template by locale
  if (!locale) return cb();
  // cache
  if (this.templatesByLocale[locale])
    return cb(null, this.templatesByLocale[locale]);

  var view = this.we.view;

  var self = this;

  async.series([
    function getInTheme(done) {
      // no theme installed
      if (!view.themes || !view.themes[view.appTheme])
        return done();

      var themeEmailTemplateFolder = view.themes[view.appTheme].config.themeFolder + '/' +
        view.themes[view.appTheme].configs.emailTemplates.path+ '/' +
        self.templateName + '/' + locale;
      // First check in theme
      fs.readdir(themeEmailTemplateFolder, function (err, result) {
        if (err) {
          if (err.code != 'ENOENT') {
            return done(err);
          }
        }

        if (result && result.length) {
          self.templatesByLocale[locale] = themeEmailTemplateFolder;
        }

        done();
      });
    },
    function getInPluginFolder(done) {
      if (self.templatesByLocale[locale]) return done();

      // then check localized email in plugin template folder
      var pluginTemplateFolder = self.templatePath + '/' + self.templateName + '/' + locale;

      fs.readdir(pluginTemplateFolder, function (err, result) {
        if (err) {
          if (err.code != 'ENOENT') {
            return done(err);
          }
        }

        if (result && result.length)
          self.templatesByLocale[locale] = pluginTemplateFolder

        done();
      });
    }
  ], function (err){
    cb(err, self.templatesByLocale[locale]);
  });
}

module.exports = EmailTemplate;