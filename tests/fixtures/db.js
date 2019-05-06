const jwt = require("jsonwebtoken");
const mongoose = require ('mongoose');
const User = require ('../../src/models/user');
const Game = require ('../../src/models/game');
const Score = require ('../../src/models/score');

const userOneID = new mongoose.Types.ObjectId();
const userOne = {
    _id: userOneID,
    name: 'Steve',
    username: 'BigSteve',
    email: 'steve@test.com',
    password: '1234',
    tokens: [{
        token: jwt.sign({_id: userOneID}, process.env.JWT_SECRET)
    }]
}

const gameOneID = new mongoose.Types.ObjectId();
const gameOne = {
    _id: gameOneID,
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

const setupDatabase = async () => {
    await User.deleteMany();
    await Game.deleteMany();
    await Score.deleteMany();
    await new User(userOne).save();
    await new Game(gameOne).save();
    await new Score(scoreOne).save();
}

module.exports = {
    userOneID,
    userOne,
    gameOneID,
    gameOne,
    scoreOneID,
    scoreOneDate,
    scoreOne,
    setupDatabase
}