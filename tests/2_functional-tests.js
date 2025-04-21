const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { TopologyDescriptionChangedEvent } = require('mongodb');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  suite('tests with chai-http', function(){

    test('issue with every field post', function(done){
        chai
        .request(server)
        .keepOpen()
        .post('/api/issues/test_project')
        .send({
            issue_title: 'test1',
             issue_text: 'test1',
             created_by: 'Alice',
             assigned_to: 'Bob',
             status_text: 'open'})
        .end(function(err, res) {
            console.log('response', res.body)
            deleteTestId = res.body._id
            assert.equal(res.body._id, deleteTestId)
            assert.equal(res.status, 200)
            assert.equal(res.type, 'application/json')
            assert.equal(res.body.issue_title, 'test1');
            assert.equal(res.body.issue_text, 'test1');
            assert.equal(res.body.created_by, 'Alice');
            assert.equal(res.body.assigned_to, 'Bob');
            assert.equal(res.body.status_text, 'open')
            done();
        })
    });

        test('issue with only required fields', function(done) {
            chai.request(server)
             .keepOpen()
             .post('/api/issues/test_project2')
             .send({
                issue_title: 'test2',
                issue_text: 'test2',
                created_by: 'me'
             }).end(function(err, res) {
                console.log('response', res.body);
                updateTestId = res.body._id;
                assert.equal(res.body._id, updateTestId)
                assert.equal(res.status, 200);
                assert.equal(res.type, 'application/json');
                assert.equal(res.body.issue_title, 'test2');
                assert.equal(res.body.issue_text, 'test2');
                assert.equal(res.body.created_by, 'me');
                done();
             })
        })
    
        test('test with missing required fields', function(done) {
            chai.request(server)
            .keepOpen()
            .post('/api/issues/test_project3')
            .send({
                issue_title: 'test3',
                issue_text: 'test3'
            }).end(function(err, res) {
                console.log('requested', res.body);
                assert.equal(res.status, 200)
                assert.equal(res.body.error, 'required field(s) missing')
                done()
            })      
        })

        test('views issues on a project no filter', function(done) {
            chai.request(server)
            .keepOpen()
            .get('/api/issues/test_project')
            .end(function(err, res) {
                console.log('response', res.body)
                assert.equal(res.status, 200)
                assert.isArray(res.body, 'response should be array')
                if (res.body.length > 0) {
                    res.body.forEach(issue => {
                      assert.containsAllKeys(issue, ['_id', 'issue_title', 'issue_text', 'created_by', 'created_on', 'updated_on']);
                    });
                  }
                  done()
            })
        })
        
        test('view issues with one filters', function(done) {
            chai.request(server)
            .keepOpen()
            .get('/api/issues/test_project?created_by=Alice')
            .end(function(err, res) {
              console.log('response', res)
              assert.equal(res.status, 200);
              assert.isArray(res.body, 'should be an array')
               if(res.body.length > 0) {
                res.body.forEach(issue => {
                    assert.equal(issue.created_by, 'Alice')
                })
               }
              done()
            })

        })

        test('view isuess using multible filters', function(done) {
            chai.request(server)
            .keepOpen()
            .get('/api/issues/test_project?created_by=Alice&assigned_to=Bob')
            .end(function(err, res) {
                console.log('response', res)
                assert.equal(res.status, 200)
                assert.isArray(res.body, 'res should be an array')
                if(res.body.length > 0 ){
                    res.body.forEach(issue => {
                      assert.equal(issue.created_by, 'Alice')
                      assert.equal(issue.assigned_to, 'Bob')
                    })
                    done()
                }
            })
        })

        test('update one field on an issues', function(done){
            chai.request(server)
            .keepOpen()
            .put('/api/issues/test_project')
            .send({
                _id: updateTestId,
                issue_text: 'updated text'
            })
            .end(function(err, res){
                console.log('result', res)
                assert.equal(res.status, 200)
                assert.equal(res.body.result, 'successfully updated')
                assert.equal(res.body._id, updateTestId)
                done()
            })
        })

        test('update multible fields', function(done){
            chai.request(server)
            .keepOpen()
            .put('/api/issues/test_project')
            .send({
                _id: updateTestId,
                issue_text: 'updated multible fields',
                status_text: 'updated for chai'                
            })
            .end(function(err, res){
                console.log('result', res.body)
                assert.equal(res.status, 200)
                assert.equal(res.body.result, 'successfully updated')
                assert.equal(res.body._id, updateTestId)
                done()
            })
        })

        test('update with missing _id', function(done){
            chai.request(server)
            .keepOpen()
            .put('/api/issues/{project}')
            .send({
                assigned_to: 'Me',

            }).end(function(err, res){
                console.log('result', res.body)
                assert.equal(res.status, 200)
                assert.equal(res.body.error, 'missing _id')
                done()
            })
        })


        test('update an issue with no field values', function(done){
            chai.request(server)
            .keepOpen()
            .put('/api/issues/{project}')
            .send({
                _id: updateTestId
            }).end(function(err, res){
                console.log('response', res.body)
                assert.equal(res.status, 200)
                assert.equal(res.body.error, 'no update field(s) sent')
                done()
            })
        })

        test('update an issue with invalid _id', function(done){
            chai.request(server)
            .keepOpen()
            .put('/api/issues/{project}')
            .send({
                _id: 'imafunny_id',
                issue_text: 'I really shouldn\'t work'
            }).end(function(err, res){
                console.log('invalid _id', res.body)
                assert.equal(res.status, 400)
                assert.equal(res.body.error, 'invalid _id')
                done()
            })
        })

        test('delete an issue with request /api/issue/{project}', function(done) {
           chai.request(server)
           .keepOpen()
           .delete('/api/issues/{project}')
           .send({_id: deleteTestId})
           .end(function(err, res) {
            console.log('project deleted', res.body)
            assert.equal(res.status, 200)
            assert.equal(res.body.result, 'successfully deleted')
            assert.equal(res.body._id, deleteTestId)
            done()   
        })
        })

        test('delete an issue with an invalid _id', function(done){
            chai.request(server)
            .keepOpen()
            .delete('/api/issues/{project}')
            .send({ _id: 'imafunnylilid'})
            .end(function(err, res) {
                console.log('invalid _id', res)
                assert.equal(res.status, 400)
                assert.equal(res.body.error,'could not delete');
                done()
            })
        })

        test('delete an issue with missing _id', function(done){
        chai.request(server)
        .keepOpen()
        .delete('/api/issues/{project}')
        .send({})
        .end(function(err, res){
            console.log('missing _id', res)
            assert.equal(res.status, 200)
            assert.equal(res.body.error, 'missing _id')
            done()
        })
    })
  })
});

