const express = require('express')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')


const User = require('./models/user')
const Game = require('./models/game')
const auth = require('./middleware/auth')

const port = 3000;
const app = express();
app.use(express.json());

mongoose.connect('mongodb://localhost/leaderboard', {useNewUrlParser: true, useCreateIndex: true})

app.get('/', (req,res) => {
    res.send("hello");
})

app.post('/user', (req, res) => {
    const user = new User(req.body);
    const token = jwt.sign({ _id: user._id.toString()}, "thisissecret");
    user.tokens = user.tokens.concat({token});

    user.save((err, user) => {
        if(err)
        {
            return res.send(err);
        }
        else
        {
            console.log("User added");
            res.send('User added');
        }
    })

})

app.post('/user/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = jwt.sign({ _id: user.id.toString()}, "thisissecret");
        user.tokens = user.tokens.concat({token});
        user.save((err, user) => {
            if(err)
            {
                return res.send(err);
            }
            else
            {
                console.log('user updated');
            }
        })
        console.log("User logged in");
        res.send({user, token});
    }
    catch (e) {
        res.status(400).send(e);
    }
    // return user;
})

app.get('/user/me', auth, async (req, res) => {
    res.send(req.user);
})

app.post('/createGame', (req, res) => {
    const game = new Game({title: 'testGame', description: 'This is a test game'});
    game.save((err, game) => {
        if (err)
        {
            return res.send(err);
        }
        else
        {
            res.send("created game");
        }
    })
})

app.post('/score', auth, async (req, res) => {
    if(!req.body.id)
    {
        return res.status(400).send({error: 'please enter a game id'})
    }

    const gameID = mongoose.Types.ObjectId(req.body.id);
    
    const game = await Game.findOne({_id: gameID});

    if(!game)
    {
        return res.status(400).send({error: 'please enter a valid game id'})
    }

    const userID = mongoose.Types.ObjectId(req.user._id);

    game.scores = game.scores.concat({score: req.body.score, owner: userID})

    game.save((err, game) => {
        if (err)
        {
            return res.send(err);
        }
        else
        {
            console.log("Score added");
            res.send(game);
        }
    });
    
})

app.listen(port, () => {
    console.log('server is up on port ' + port);
})

/* DATABASE DESIGN

USER {
    id: Object ID,
    name: "USERS NAME",
    email: "Users email address",
    password: "The users password",
    friends: [
        {
            friendsID: object ID,
        },
        {
            friendsID: object ID
        }
    ],
    games: [                                    // Each game the user has scores in will be an entry in this array
        {
            title: "The title of the game",
            description: "Description of the game",
            highscores: [                       // Each score in the array holds the object ID for the score within 
                {                               // that particaular games score database
                    score1: Object id,
                    owner: "The persons username"
                },
                {,
                    score2: Object id
                    owner: "The persons username"
                }
            ]
        }
    ]
}


SCORE DATABASE

GAMES [{
    game: {
        id: Object ID,
        title: "Title of the game".
        description: "Description of the game",
        scores: [{
            score: {
                id: Object id,
                score: 1234 (users score),
                owner: Object ID of the owning user
            }
        }]
    }
}]


*/