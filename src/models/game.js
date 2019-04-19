const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    scores: [{
        score: {
            type: Number,
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            // required: true,
            ref: 'User'
        }
    }]
})

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;