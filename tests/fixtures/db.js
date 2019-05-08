const jwt = require("jsonwebtoken");
const mongoose = require ('mongoose');
const User = require ('../../src/models/user');
const Game = require ('../../src/models/game');
const Score = require ('../../src/models/score');

const userOneID = new mongoose.Types.ObjectId();
const userTwoID = new mongoose.Types.ObjectId();
const userOne = {
    _id: userOneID,
    name: 'Steve',
    username: 'BigSteve',
    email: 'steve@test.com',
    password: '1234',
    tokens: [{
        token: jwt.sign({_id: userOneID}, process.env.JWT_SECRET)
    }],
    friends:[
        userTwoID
    ]
}

const userTwo = {
    _id: userTwoID,
    name: 'jon',
    username: 'SmallJon',
    email: 'jon@test.com',
    password: '1234',
    tokens: [{
        token: jwt.sign({_id: userTwoID}, process.env.JWT_SECRET)
    }]
}

const userThreeID = new mongoose.Types.ObjectId();
const userThree = {
    _id: userThreeID,
    name: 'Dave',
    username: 'davey',
    email: 'dave@test.com',
    password: '1234',
    tokens: [{
        token: jwt.sign({_id: userThreeID}, process.env.JWT_SECRET)
    }]
}

const gameOneID = new mongoose.Types.ObjectId();
const gameOne = {
    _id: gameOneID,
    title: 'test game',
    description: 'This is a test game'
}

const gameTwoID = new mongoose.Types.ObjectId();
const gameTwo = {
    _id: gameTwoID,
    title: 'test game',
    description: 'This is a test game'
}

const scoreOneID = new mongoose.Types.ObjectId();
const scoreOneDate = Date.now();
const scoreOne = {
    _id: scoreOneID,
    score: 100,
    owner: userOne.username,
    game: gameOneID,
    date: scoreOneDate
};

const scoreTwoID = new mongoose.Types.ObjectId();
const scoreTwo = {
    _id: scoreTwoID,
    score: 1001,
    owner: userTwo.username,
    game: gameOneID,
    date: Date.now()
};

const scoreThreeID = new mongoose.Types.ObjectId();
const scoreThree = {
    _id: scoreThreeID,
    score: 150,
    owner: userThree.username,
    game: gameOneID,
    date: Date.now()
};

const scoreFourID = new mongoose.Types.ObjectId();
const scoreFour = {
    _id: scoreFourID,
    score: 1500,
    owner: userThree.username,
    game: gameTwoID,
    date: Date.now()
}

const setupDatabase = async () => {
    await User.deleteMany();
    await Game.deleteMany();
    await Score.deleteMany();
    await new User(userOne).save();
    await new User(userTwo).save();
    await new User(userThree).save();
    await new Game(gameOne).save();
    await new Game(gameTwo).save();
    await new Score(scoreOne).save();
    await new Score(scoreTwo).save();
    await new Score(scoreThree).save();
    await new Score(scoreFour).save();
}

module.exports = {
    userOneID,
    userOne,
    userTwoID,
    userTwo,
    userThreeID,
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
    scoreFourID,
    scoreFour,
    setupDatabase
}