const request = require('supertest');
const app = require("../src/app");
const User = require('../src/models/user');
const {userOneID, userOne, setupDatabase} = require('./fixtures/db');

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