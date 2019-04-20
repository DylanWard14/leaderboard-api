const mongoose = require('mongoose')

const scoreSchema = new mongoose.Schema({
    score: {
        type: Number,
        require: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    game: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
})

const Score = mongoose.model('Score', scoreSchema);

module.exports = Score;