var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var _ = require('lodash');
var http;
var we;

function widgetStub() {
  return {
    title: 'a widgetTitle',
    layout: 'default',
    regionName: 'sidebar',
    type: 'html',
    configuration: {
      html: '<iframe width="560" height="315" src="https://www.youtube.com/embed/Oiyh33__Txw"'+
       'frameborder="0" allowfullscreen></iframe>'
    }
  }
}

describe('widgetFeature', function() {
  var salvedUser, salvedUserPassword;

  before(function (done) {
    http = helpers.getHttp();
    we = helpers.getWe();
    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, user) {
      if (err) throw new Error(err);
      salvedUser = user;
      salvedUserPassword = userStub.password;
      done();
    })
  });

  describe('CRUD', function() {
    it('post /api/v1/widget should create one widget and return it as HTML', function (done) {
      var w = widgetStub();
      request(http)
      .post('/api/v1/widget')
      .send(w)
      .expect(201)
      .end(function (err, res) {
        if (err) throw err;
        //console.log('>>>', res.text);
        assert(res.text);
        done();
      });
    });

    it('post /api/v1/widget should create one widget and return it as JSON', function (done) {
      var w = widgetStub();
      request(http)
      .post('/api/v1/widget')
      .send(w)
      .set('Accept', 'application/json')
      .expect(201)
      .end(function (err, res) {
        if (err) throw err;
        assert(res.body);
        assert(res.body.widget);
        assert(res.body.widget[0].html);
        assert.equal(res.body.widget[0].title, w.title);
        assert.equal(res.body.widget[0].regionName, w.regionName);
        assert.equal(res.body.widget[0].configuration.html, w.configuration.html);
        done();
      });
    });

    it('get /api/v1/widget/:id should return one widget with HTML', function (done) {

      var w = widgetStub();
      we.db.models.widget.create(w).then(function (record) {
        request(http)
        .get('/api/v1/widget/' + record.id)
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;
          assert(res.text.search(w.title) > -1);
          assert(res.text.search(w.configuration.html) > -1);
          done();
        });
      });
    });

    it('get /api/v1/widget should return the widget list with suport to filter by region', function (done) {

      var ws = [ widgetStub(), widgetStub(), widgetStub() ];

      we.db.models.widget.bulkCreate(ws).then(function () {
        request(http)
        .get('/api/v1/widget')
        .expect(200)
        .set('Accept', 'application/json')
        .end(function (err, res) {
          if (err) throw err;
          assert(res.body);
          assert(res.body.widget);
          assert(res.body.widget[0].html);

          done();
        });
      });
    });

    it('put /api/v1/widget/:id should update widget configuration', function (done) {
      var w = widgetStub();
      we.db.models.widget.create(w).then(function (record) {
        var w = {
          title: 'a new title',
          configuration: {
            html: 'new html <strong>text</strong>'
          }
        };
        request(http)
        .put('/api/v1/widget/' + record.id)
        .send(w)
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;
          assert(res.text.search(w.title) > -1);
          assert(res.text.search(w.configuration.html) > -1);
          done();
        });
      });
    });

    it('remove /api/v1/widget/:id should delete one widget', function (done) {
      var w = widgetStub();
      we.db.models.widget.create(w).then(function (record) {
        request(http)
        .delete('/api/v1/widget/' + record.id)
        .expect(204)
        .end(function (err, res) {
          if (err) throw err;
          done();
        });
      });
    });
  });

  describe('USAGE', function() {
    it('get / should return one HTML page build with widgets', function (done) {

      // create some widgets with regions
      var ws = [ widgetStub(), widgetStub(), widgetStub() ];

      we.db.models.widget.bulkCreate(ws).then(function () {
        request(http)
        .get('/')
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;

          assert(res.text);

          done();
        });
      });

    });
  });
});