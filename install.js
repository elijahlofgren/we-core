module.exports = {
  requirements: function(we, done) {

    done();
  },
  /**
   * Install function run in we.js install.
   *
   * @param  {Object}   we    we.js object
   * @param  {Function} done  callback
   */
  install: function install(we, done) {
    done();
  },

  /**
   * Return a list of updates
   *
   * @param  {Object} we we.js object
   * @return {Array}    a list of update objects
   */
  updates: function updates() {
    return [{
      version: '0.3.69', // your plugin version
      update: function update0369(we, done) {
        var sql = 'ALTER TABLE `widgets` ADD '+
          ' COLUMN `inRecord` TINYINT(1) DEFAULT NULL;';
        we.db.defaultConnection.query(sql).then(function() {
          done();
        }).catch(done);
      }
    } , {
      version: '0.3.120',
      update: function update03120 (we, done) {

        we.utils.async.series([
          function changeWidgetTableThemeField(done) {
            var sql = 'ALTER TABLE `widgets` '+
              'CHANGE COLUMN `theme` `theme` VARCHAR(255) NULL ;';
            we.db.defaultConnection.query(sql).then(function() {
              done();
            }).catch(done);
          },
          function addRoleIsSystemField(done) {
            var sql = 'ALTER TABLE `roles` ' +
              'ADD COLUMN `isSystemRole` TINYINT(1) NULL DEFAULT 0 AFTER `updatedAt`;';
            we.db.defaultConnection.query(sql)
            .then(function() {
              done();
            }).catch(function (err){
              if (err != 'SequelizeDatabaseError') {
                return done(err);
              } else {
                we.log.error(err);
              }

              done();
            });
          }
        ], done);
      }
    },
    {
      version: '1.0.2',
      update: function (we, done) {
        we.utils.async.series([
          function addWidgetTablURLField(done) {
            var sql = 'ALTER TABLE `widgets` '+
              ' ADD COLUMN `path` TEXT NULL; ';
            we.db.defaultConnection.query(sql).then(function() {
              done();
            }).catch(function (err) {
              if (err != 'SequelizeDatabaseError') {
                return done(err);
              } else {
                we.log.error(err);
              }
              done();
            });
          }
        ], done);
      }
    },
    {
      version: '1.2.0',
      update: function (we, done) {
        we.utils.async.series([
          function updateUserTable(done) {
            var sql = 'ALTER TABLE `users` '+
              ' ADD COLUMN `roles` TEXT NULL; ';
            we.db.defaultConnection.query(sql).then(function() {
              done();
            }).catch(function (err) {
              if (err) {
                we.log.error(err);
              }

              done();
            });
          },

          function migrateRolesField(done) {
            var sql = ' SELECT users_roles.userId, roles.name FROM users_roles '+
            ' LEFT JOIN roles ON roles.id=users_roles.roleId;';
            we.db.defaultConnection.query(sql)
            .spread(function (results) {
              var users = {};

              we.utils.async.eachSeries(results, function onEachResult(r, next){
                if (!users[r.userId]) {
                  users[r.userId] = {
                    id: r.userId,
                    roles: []
                  };
                }

                users[r.userId].roles.push(r.name);
                next();
              }, function afterEachResult(){
                we.utils.async.eachSeries(users, function onUpdateEachUser(user, next){

                  we.db.models.user.update(user, {
                    where: {
                      id: user.id
                    }
                  }).then(function afterUpdateAllUsers(r) {
                    we.log.info('install.js:Update user data:', r);
                    next();
                  }).catch(next);
                }, function(){
                  done();
                });
              });
              // done();
            }).catch(function (err) {
              if (err) {
                we.log.error(err);
              }
              done();
            });
          }
        ], done);
      }
    }
    ];
  }
};

