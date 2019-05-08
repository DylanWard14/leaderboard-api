const request = require('supertest');
const app = require("../src/app");
const User = require('../src/models/user');
const {
    userOneID, 
    userOne,
    userTwo,
    userThreeID,
    userThree,
    gameOneID,
    gameOne,
    setupDatabase
} = require('./fixtures/db');

beforeEach(setupDatabase);

test("should sign up a new user", async () => {
    const response = await request(app).post('/user').send({
        name: "Dylan",
        username: "timid_au",
        email: "dylan@test.com",
        password: "1234"
    }).expect(201);

    //assert that the database was changed correctly
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();

    // assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name: "Dylan",
            email: "dylan@test.com"
        },
        token: user.tokens[0].token
    })
    
    expect(user.password).not.toBe('1234')
})

test("Should login existing user", async () => {
    const response = await request(app).post('/user/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    const user = await User.findById(userOneID);
    expect(response.body.token).toBe(user.tokens[1].token);
})

test("Should read the current users profile", async () => {
    const response = await request(app)
    .get('/user/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

    expect(response.body).toMatchObject({
        name: userOne.name,
        username: userOne.username,
        email: userOne.email
    })
})

test("Should not read the profile of unauthenticated user", async () => {
    const response = await request(app)
    .get('/user/me')
    .send()
    .expect(401);

    expect(response.body).toMatchObject({
        error: "Please Authenticate"
    })
})

test("Should logout user", async () => {
    await request(app)
    .post('/user/logout')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);


    const user = await User.findById(userOneID);
    expect(user.tokens[0]).not.toBe(userOne.tokens[0].token);
})

test("Should logout user from all devices", async () => {
    await request(app).post('/user/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    await request(app).post('/user/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    let user = await User.findById(userOneID);

    expect(user.tokens.length).toEqual(3);

    await request(app)
    .post('/user/logout/all')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

    user = await User.findById(userOneID);
    expect(user.tokens.length).toEqual(0);
})

// Get friends
test("Should get info of friends", async () => {
    const response = await request(app)
    .get('/friends')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .expect(200);

    expect(response.body[0]).toMatchObject({
        _id: userTwo._id.toString(),
        email: userTwo.email,
        name: userTwo.name,
        username: userTwo.username
    });
})

// Add friend
test("Should add a friend", async () => {
    const response = await request(app)
    .post('/friend')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({username: userThree.username})
    .expect(200);

    const user = await User.findById(userOneID);
    expect(user.friends.length).toBe(2);
    expect(user.friends[1]).toEqual(userThreeID);
})