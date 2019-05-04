const express = require('express')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')


const User = require('./models/user')
const Game = require('./models/game')
const Score = require('./models/score')
const auth = require('./middleware/auth')

const port = 3000;
const app = express();
app.use(express.json());

mongoose.connect('mongodb://localhost/leaderboard', {useNewUrlParser: true, useCreateIndex: true}).then(
    () => {
        console.log("Connection to mongodb database successful");
    },
    err => {
        console.log('Error connecting to mongodb database');
    }
);


app.get('/', (req,res) => {
    res.send("hello");
})

app.post('/user', async (req, res) => {
    const user = new User(req.body);
    
    try{
        await user.save();
        const token = jwt.sign({ _id: user._id.toString()}, "thisissecret");
        user.tokens = user.tokens.concat({token});
        await user.save();
        res.status(201).send('User added');
    } catch (e) {
        res.status(400).send(e);
    }
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
        res.status(400).send({error: 'Incorrect username or password'});
    }
    // return user;
})

app.get('/user/me', auth, async (req, res) => {
    res.send(req.user);
})

// Creates a new game
app.post('/createGame', (req, res) => {
    const game = new Game({title: 'testGame3', description: 'This is another test game'});
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

app.post('/addGame', auth, async (req, res) => {
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

    const user = req.user;

    user.games = user.games.concat({game: game._id})

    user.save((err, user) => {
        if(err)
        {
            res.send(err);
        }
        else
        {
            res.send(user);
        }
    })

})

// Add a score to the database, add a game id into the json body
app.post('/score', auth, async (req, res) => {
    //Check if game id was entered
    if(!req.body.gameID)
    {
        return res.status(400).send({error: 'please enter a game id'})
    }
    // Check if score was entered
    if(!req.body.score)
    {
        return res.status(400).send({error: 'please enter a score value'})
    }
    // Conver the game id
    const gameID = mongoose.Types.ObjectId(req.body.gameID);
    // find the game
    const game = await Game.findOne({_id: gameID});
    // if there is no game
    if(!game)
    {
        return res.status(400).send({error: 'please enter a valid game id'})
    }

    // convert the users id
    // const userID = mongoose.Types.ObjectId(req.user._id);

    // Check if the user already has a score in the database
    const oldScore = await Score.findOne({owner: req.user.name, game: gameID});

    // if a score for this player already exists check if it is lower then the new score
    if(oldScore)
    {
        if(oldScore.score > req.body.score)
        {
            return res.send("You did not beat your highscore");
        }
        console.log("deleting users old score")
        console.log(oldScore._id);
        await Score.deleteOne(oldScore);
    }

    // Create the json score
    const score = new Score({
        score: req.body.score,
        owner: req.user.username,
        game: gameID,
        date: Date.now()
    })

    // save the score
    score.save((err, score) => {
        if (err)
        {
            res.send(err);
        }
        else
        {
            res.send(score);
        }
    })
    
})

app.get('/scores/me', auth, async (req, res) => {
    const user = req.user;
    let scores;

    if(!req.body.gameID)
    {
        scores = await Score.find({owner: user.username});

    }
    else
    {
        const gameID = mongoose.Types.ObjectId(req.body.gameID);
        scores = await Score.find({owner: user.username, game: gameID});
    }

    if(!scores)
    {
        return res.status(400).send({error: 'No scores found'})
    }

    res.send(scores);
})

app.get('/scores/game', auth, async (req, res) => {
    if(!req.query.title)
    {
        return res.send('Please enter a game title')
    }
    const title = req.query.title;
    const game = await Game.find({title: title});
    if (!game[0])
    {
        return res.status(400).send({error: 'unable to find game'})
    }

    console.log(game[0]);

    //mongoose.Types.ObjectId(req.body.gameID);
    let sortBy = "-score";

    if(req.query.sortBy)
    {
        const sortField = req.query.sortBy.split(':')[0];
        const order = req.query.sortBy.split(":")[1];

        if(sortField.toLowerCase() != 'score' && sortField.toLowerCase() != 'date')
        {
            return res.status(400).send({error: 'Please enter a valid search field'})
        }
        else if (order.toLowerCase() != 'asc' && order.toLowerCase() != 'desc')
        {
            return res.status(400).send({error: 'Please enter a valid sort order'})
        }
        
        if(order.toLowerCase() == 'asc')
        {
            sortBy = sortField;
        }
        else
        {
            sortBy = '-'+sortField;
        }
    }
    const limit = parseInt(req.query.limit);
    const skip = parseInt(req.query.skip);
    const scores = await Score.find({game: game[0]._id}).sort(sortBy).limit(limit).skip(skip);

    if(!scores)
    {
        return res.send('Unable to find scores, please ensure you have entered the correct game');
    }

    res.send(scores);
})

app.get('/test', (req,res) => {
    res.send({
        message: "this is working"
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


GAME DATABASE

GAMES [{
    game: {
        id: Object ID,
        title: "Title of the game"
        description: "Description of the game"
}]

SCORES DATABASE

SCORES [{
    score: {
        id: Object ID,
        score: int,
        owner: String this will be the name of the owner
    }
}]
*/