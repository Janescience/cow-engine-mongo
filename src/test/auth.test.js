const express = require('express');
const request = require('supertest');
const authController = require('../controllers/auth.controller');
const { verifySignUp,authJwt} = require("../middlewares");
const jwt = require('jsonwebtoken');
const config = require("../config/auth.config.js");
const db = require('../config/conn.memory');

const md = require("../models");
const RefreshToken = md.refreshToken;

beforeAll(async () => {
    await db.connect()
})

afterEach(async () => {
    await db.clearDatabase()
})

afterAll(async () => {
    await db.closeDatabase()
})

//Signup
describe('Signup ', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/signup',[verifySignUp.checkDuplicateUsername],authController.signup);
  });

  test('Should create a new user', async () => {
    const res = await request(app)
      .post('/signup')
      .send({
        username: 'signuptest',
        farmName: 'signuptest',
        password: 'P@ssw0rd'
      });
    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty('message','Registered Successfully.')
  });

  test('Should return error if user already exists', async () => {
    await request(app)
      .post('/signup')
      .send({
        username: 'signuptest',
        farmName: 'signuptest',
        password: 'P@ssw0rd'
      });
    const res = await request(app)
      .post('/signup')
      .send({
        username: 'signuptest',
        farmName: 'signuptest',
        password: 'P@ssw0rd'
      });
    expect(res.status).toEqual(400);
    expect(res.body).toHaveProperty('message','Failed! Username is already in use!')
  });
});


//Signin
describe('Signin', () => {
    let app;
  
    beforeEach(async () => {
      app = express();
      app.use(express.json());
      app.post('/signin',authController.signin);

      app.post('/signup',authController.signup);

      const user = { username: 'username', password: 'password' , farmName : 'farm' };
      await request(app).post('/signup').send(user);
    });
  
    test('Should return a token when the correct username and password are provided', async () => {

      const res = await request(app)
        .post('/signin')
        .send({
          username: 'username',
          password: 'password'
        });

        const decoded = jwt.verify(res.body.accessToken,config.secret);
        expect(decoded).toHaveProperty('id');

        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('username','username');
        expect(res.body).toHaveProperty('farm',expect.any(Object));
        expect(res.body).toHaveProperty('accessToken',expect.any(String));
        expect(res.body).toHaveProperty('lineToken',null);
        expect(res.body).toHaveProperty('refreshToken',expect.any(String));
    });

    test('Should return an error when the wrong username is provided', async () => {

        const res = await request(app)
          .post('/signin')
          .send({
            username: 'wrong_username',
            password: 'password'
          });
  
        expect(res.status).toEqual(401);
        expect(res.body).toHaveProperty('message','ชื่อผู้ใช้ไม่ถูกต้อง หรือ ไม่มีผู้ใช้ในระบบ กรุณาลองอีกครั้ง');
        
    });

    test('Should return an error when the wrong password is provided', async () => {

        const res = await request(app)
            .post('/signin')
            .send({
                username: 'username',
                password: 'wrong_password'
            });

            expect(res.status).toEqual(401);
            expect(res.body).toHaveProperty('message','รหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง');
            expect(res.body).toHaveProperty('accessToken',null);
    });
});

//Get User
describe('Get user', () => {
    let app;
  
    beforeEach(async () => {
      app = express();
      app.use(express.json());
      app.post('/signin',authController.signin);
      app.post('/signup',authController.signup);
      app.post('/user',[authJwt.verifyToken],authController.user);
      const user = { username: 'username', password: 'password' , farmName : 'farm' };
      await request(app).post('/signup').send(user);

    });
  
    test('Should return a user when the correct data after login', async () => {
        const user = { username: 'username', password: 'password'};
        const signined = await request(app).post('/signin').send(user);

        const res = await request(app).post('/user').set('x-access-token',signined.body.accessToken);

        expect(res.status).toEqual(200);
        expect(res.body.user).toHaveProperty('_id',expect.any(String));
        expect(res.body.user).toHaveProperty('username','username');
        expect(res.body.user).not.toHaveProperty('password');
        expect(res.body.user).toHaveProperty('farm',expect.any(Object));
    });

    test('Should return error no token provided because not login', async () => {
        const res = await request(app).post('/user');

        expect(res.status).toEqual(403);
        expect(res.body).toHaveProperty('message','No token provided!');
    });

    test('Should return error unauthorized is wrong access token', async () => {
        const res = await request(app).post('/user').set('x-access-token','wrong_token')

        expect(res.status).toEqual(401);
        expect(res.body).toHaveProperty('message','Unauthorized!');
    });

    test('Should return error unauthorized is token expired', async () => {
        const expiredToken = jwt.sign({ id: 123 },config.secret, { expiresIn: '1' });

        const res = await request(app).post('/user').set('x-access-token',expiredToken)

        expect(res.status).toEqual(401);
        expect(res.body).toHaveProperty('message','Unauthorized! Access Token was expired!');
    });

});

//Get User
describe('Refresh Token', () => {
    let app;
  
    beforeEach(async () => {
      app = express();
      app.use(express.json());
      app.post('/signin',authController.signin);
      app.post('/signup',authController.signup);
      app.post('/refreshToken',authController.refreshToken);
      app.post('/user',[authJwt.verifyToken],authController.user);

      const user = { username: 'username', password: 'password' , farmName : 'farm' };
      await request(app).post('/signup').send(user);

    });
  
    test('Should return refresh token success', async () => {
        const user = { username: 'username', password: 'password'};
        const signined = await request(app).post('/signin').send(user);

        const res = await request(app).post('/refreshToken').send({refreshToken : signined.body.refreshToken})

        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
    });

    test('Should return no refresh token ', async () => {
        const res = await request(app).post('/refreshToken').send({refreshToken : null})

        expect(res.status).toEqual(403);
        expect(res.body).toHaveProperty('message','Refresh Token is required!');
    });

    test('Should return not found refresh token in db', async () => {
        const res = await request(app).post('/refreshToken').send({refreshToken : 'wrong_token'})

        expect(res.status).toEqual(403);
        expect(res.body).toHaveProperty('message','Refresh token is not in database!');
    });

    test('Should return refresh token was expired', async () => {
        const user = { username: 'username', password: 'password'};
        const signined = await request(app).post('/signin').send(user);
        const userResp = await request(app).post('/user').set('x-access-token',signined.body.accessToken);

        let refreshToken = await RefreshToken.createToken({_id:userResp.body.user._id},0);

        const res = await request(app).post('/refreshToken').send({refreshToken : refreshToken})

        expect(res.status).toEqual(403);
        expect(res.body).toHaveProperty('message','Refresh token was expired. Please make a new signin request');
    });

    
});
