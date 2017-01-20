const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const should = chai.should();
const ObjectID = require('mongodb').ObjectID;
const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {DATABASE_URL} = require('../config');

chai.use(chaiHttp);

//using faker library to insert fake data
function seedBlogPostsData() {
  console.info('seeding blog post data');
  const seedData = [];
  for (let i=1; i<=10; i++) {
    seedData.push(generateBlogPostsData());
  }
  // this will return a promise
  return BlogPost.insertMany(seedData);
}

function generateBlogPostsData() {
  return {
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    },
    title: faker.lorem.sentence(),
    content: faker.lorem.sentences()
  }
}

// this function deletes the entire database.
// we'll call it in an `afterEach` block below
// to ensure  ata from one test does not stick
// around for next one
function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('Blog-Posts API resource', function() {

  before(function() {
    return runServer(DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogPostsData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  
  describe('GET endpoint', function() {

    it('should return all existing blog posts', function() {
      return chai.request(app)
        .get('/posts')
        .then(function(_res) {
          //console.log(_res);
          _res.should.have.status(200);
          res = _res.body;
           //console.log(res);
          // otherwise our db seeding didn't work
          res.should.have.length.of.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
         res.should.have.length.of(count);
        });
    });
  });


   it('should return blog posts with right fields', function() {

      let resBlogPosts;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.of.at.least(1);

        res.body.forEach(function(post) {
            post.should.be.a('object');
            post.should.include.keys(
              'id', 'author', 'title', 'content');
          });
            resBlogPosts = res.body[0];
            console.log(resBlogPosts);
            return BlogPost.findById(resBlogPosts.id);
        })
        .then(function(post) {
          console.log(post);
          let objectId = new ObjectID(resBlogPosts.id);
          console.log(objectId.equals(post._id));
          objectId.equals(post._id).should.equal(true);
          resBlogPosts.author.should.equal(post.author.firstName +" "+ post.author.lastName);
          resBlogPosts.title.should.equal(post.title);
          resBlogPosts.content.should.equal(post.content);
        });
    });

  describe('POST endpoint', function() {
    it('should add a new blog posts', function() {
      const newBlogPost = generateBlogPostsData();
      return chai.request(app)
        .post('/posts')
        .send(newBlogPost)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'id', 'author', 'title', 'content');
          res.body.author.should.equal(newBlogPost.author.firstName +" "+ newBlogPost.author.lastName);
          // cause Mongo should have created id on insertion
          res.body.id.should.not.be.null;
          res.body.content.should.equal(newBlogPost.content);
          res.body.title.should.equal(newBlogPost.title);
          return BlogPost.findById(res.body.id);
        })
        .then(function(post) {
          post.author.firstName.should.equal(newBlogPost.author.firstName);
          post.author.lastName.should.equal(newBlogPost.author.lastName);
          post.title.should.equal(newBlogPost.title);
          post.content.should.equal(newBlogPost.content);
        });
    });
  });

  describe('PUT endpoint', function() {
    it('should update fields you send over', function() {
      const updateData = {
        author:{
          firstName:'foo',
          lastName:'bar'
        },
        content: 'lorem ipsum gasgfjgfajkfshakf',
        title:'testing'
      };

      return BlogPost
        .findOne()
        .exec()
        .then(function(post) {
          updateData.id = post.id;

          return chai.request(app)
            .put(`/posts/${post.id}`)
            .send(updateData);
        })
        .then(function(res) {
          res.should.have.status(201);

          return BlogPost.findById(updateData.id).exec();
        })
        .then(function(post) {
          post.author.firstName.should.equal(updateData.author.firstName);
          post.author.lastName.should.equal(updateData.author.lastName);
          post.content.should.equal(updateData.content);
          post.title.should.equal(updateData.title);
        });
      });
  });

  describe('DELETE endpoint', function() {
    it('delete a blog post by id', function() {

      let post;
      return BlogPost
        .findOne()
        .exec()
        .then(function(_post) {
          post = _post;
          return chai.request(app).delete(`/posts/${post.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return BlogPost.findById(post.id).exec();
        })
        .then(function(_post) {
          should.not.exist(_post);
        });
    });
  });
});
