const request = require('supertest');
const app = require("../src/app");
const User = require('../src/models/user');
const Game = require('../src/models/game');
const Score = require('../src/models/score');
const {
    userOneID,
    userOne,
    userTwoID,
    userTwo,
    userThree,
    gameOneID,
    gameOne,
    gameTwo,
    gameTwoID,
    scoreOneID,
    scoreOneDate,
    scoreOne,
    scoreTwoID,
    scoreTwo,
    scoreThree,
    scoreThreeID,
    scoreFour,
    scoreFourID,
    setupDatabase
} = require('./fixtures/db');
const mongoose = require('mongoose');

beforeEach(setupDatabase);

test("Should get users scores", async () => {
    const response = await request(app)
    .get('/scores/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

    const currentScoreOne = response.body[0]
    expect(currentScoreOne).toMatchObject(
        {
            _id: scoreOne._id.toString(),
            game: gameOne._id.toString(),
            score: scoreOne.score,
            owner: scoreOne.owner
        }
    )
})

//test should get user scores filtered by a game

test("Add score to user", async () => {
    const response = await request(app)
    .post('/score')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        gameID: gameTwoID,
        score: 1000
    }).expect(200);
    
    const score = await Score.findOne({owner: userOne.username, game: gameTwoID});
    expect(score).toMatchObject({
        game: gameTwoID,
        score: 1000,
        owner: userOne.username
    })
})

// Test should get all scores from a game filter descending scores
test("Should get all scores from a game and filter them in descending order", async () => {
    const response = await request(app)
    .get('/scores/game')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .query({title: gameOne.title, sortBy: 'score:desc'})
    .send()
    .expect(200);
    
    expect(response.body[0]).toMatchObject({
        _id: scoreTwo._id.toString(),
        score: scoreTwo.score,
        owner: scoreTwo.owner,
        game: scoreTwo.game.toString()
    });
})

test("Should get all scores from a game and filter them in ascending order", async () => {
    const response = await request(app)
    .get('/scores/game')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .query({title: gameOne.title, sortBy: 'score:asc'})
    .send()
    .expect(200);
    
    expect(response.body[0]).toMatchObject({
        _id: scoreOne._id.toString(),
        score: scoreOne.score,
        owner: scoreOne.owner,
        game: scoreOne.game.toString()
    });
})

// Get scores from game and filter by friends
test("Should get all scores from a game filtered by friends only", async () => {
    const response = await request(app)
    .get('/scores/game')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .query({title: gameOne.title, sortBy: 'score:desc', friends: 'true'})
    .send()
    .expect(200);

    expect(response.body.length).toBe(2);
    expect(response.body).toMatchObject([
        {
            _id: scoreTwoID.toString(),
            score: scoreTwo.score,
            owner: scoreTwo.owner
        },
        {
            _id: scoreOneID.toString(),
            score: scoreOne.score,
            owner: scoreOne.owner
        }
    ]);
})

test("Should get all scores assosicated with a user", async () => {
    const response = await request(app)
    .get('/scores/other')
    .query({username: userThree.username})
    .send()
    .expect(200);

    expect(response.body.length).toBe(2);
    expect(response.body).toMatchObject([
        {
            _id: scoreThreeID.toString(),
            score: scoreThree.score,
            owner: scoreThree.owner,
            game: scoreThree.game.toString(),
        },
        {
            _id: scoreFourID.toString(),
            score: scoreFour.score,
            owner: scoreFour.owner,
            game: scoreFour.game.toString(),
        }
    ])

})