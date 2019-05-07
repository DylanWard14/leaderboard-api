const request = require('supertest');
const app = require("../src/app");
const User = require('../src/models/user');
const Game = require('../src/models/game');
const {
    userOneID,
    userOne,
    gameOneID,
    gameOne,
    setupDatabase
} = require('./fixtures/db');

beforeEach(setupDatabase);

test("Should add a game to the user", async () => {
    await request(app)
    .post('/addGame')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        id: gameOneID
    }).expect(200);

    const user = await User.findById(userOneID);
    expect(user.games[0]).toEqual(gameOneID);
})

test("Should create a new game", async () => {
    const response = await request(app)
    .post('/createGame')
    .send({
        title: "test game 2",
        description: "The sequal to test game"
    }).expect(200);

    const game = await Game.findOne({title: "test game 2"});
    expect(game).toMatchObject({
        title: 'test game 2',
        description: 'The sequal to test game'
    })
})

test("Should find game by id", async () => {
    const game = await Game.findById(gameOneID);
    expect(game).toMatchObject({
        title: gameOne.title,
        description: gameOne.description
    })
})