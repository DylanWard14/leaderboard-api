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

// Connect to the database at localhost:leadboard
mongoose.connect('mongodb://localhost/leaderboard', {useNewUrlParser: true, useCreateIndex: true}).then(
    () => {
        console.log("Connection to mongodb database successful");
    },
    err => {
        console.log('Error connecting to mongodb database');
    }
);

// Create a user
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

// Login a user
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
})

// Logout a user
app.post('/user/logout', auth, async (req, res) => {
    try {
        user = req.user;
        user.tokens = user.tokens.filter((token) => {
            return token.token !== req.token;
        })

        await user.save((err, user) => {
            if (err)
            {
                return res.status(500).send({error: "error logging out"})
            }
            else
            {
                res.send(user);
            }
        })
    }
    catch (e) {
        res.status(500).send();
    }
})

// Logout a user from all locations, removing all of the JSON Web Tokens
app.post('/user/logout/all', auth, async (req, res) => {
    try {
        user = req.user;
        user.tokens = [];

        await user.save((err, user) => {
            if (err)
            {
                return res.status(500).send({error: "error logging out"})
            }
            else
            {
                return res.send(user);
            }
        })
    }
    catch (e) {
        res.status(500).send();
    }
})

// Get the current users profile
app.get('/user/me', auth, async (req, res) => {
    res.send(req.user);
})

// Creates a new game
app.post('/createGame', (req, res) => {
    const title = req.body.title;
    const description = req.body.description;

    if (!title || !description)
    {
        return res.status(400).send({error: 'Please enter a title and description'})
    }
    const game = new Game({title, description});

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

// Add this game to the user, essentially saying that the user has played/owns the game
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

    user.games = user.games.concat(game._id)

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

// Fetch all the scores for the current user
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

// Search the leaderboard for a specific game with options to sort it in date/score order and filter by friends only
app.get('/scores/game', auth, async (req, res) => {
    // If a title or a game id was not supplied
    if(!req.query.title && !req.query.gameID)
    {
        return res.send('Please enter a valid game')
    }
    const title = req.query.title;
    let gameID = req.query.gameID;
    let game;

    if (title)
    {
        //If the title was supplied search by it
        game = await Game.findOne({title: title});
    }
    else if (gameID && mongoose.Types.ObjectId.isValid(gameID))
    {   
        // if the game id was supplied then search with that instead
        game = await Game.findOne({_id: gameID})
    }
    if (!game)
    {
        // If no game was found then return an error
        return res.status(400).send({error: 'unable to find game'})
    }
    
    let sortBy = "-score";

    // Handle the filtering
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

    let scores = undefined;

    //Check if this is a friends only list

    if(req.query.friends.toLowerCase() == 'true')
    {
        const user = req.user;
        const friends = await User.find({_id: { $in: user.friends}});
        // Loop through all friends and save their usernames
        let usernames = friends.map((friend) => {
            return friend.username;
        })
    
        usernames = usernames.concat(user.username);
        scores = await Score.find({game: game._id, owner: { $in: usernames}}).sort(sortBy).limit(limit).skip(skip);
    }
    else
    {
        // Find the scores
        scores = await Score.find({game: game._id}).sort(sortBy).limit(limit).skip(skip);
    }

    

    if(!scores)
    {
        return res.send('Unable to find scores, please ensure you have entered the correct game');
    }

    if (scores.length == 0)
    {
        return res.send('No scores have been achieved yet')
    }

    res.send(scores);
})

// Add a friend
app.post('/friend', auth, async (req, res) => {
    const user = req.user;

    if (!req.body.username && !req.body.friendID)
    {
        return res.status(400).send({error: 'Please enter a username or friend ID'});
    }

    let friendToAdd;
    if(req.body.username)
    {
        friendToAdd = await User.findOne({username: req.body.username});
    }
    else if (req.body.friendID)
    {
        friendToAdd = await User.findOne({_id: req.body.friendID});
    }

    if(!friendToAdd)
    {
        return res.status(400).send({error: 'Unable to find user, please enter a valid user'});
    }

    let friendAlreadyExists = user.friends.some(function (friend) {
        return friend.equals(friendToAdd._id);
    });

    if(friendAlreadyExists)
    {
        return res.status(400).send({error: "Friend already in friends list"});
    }

    console.log(friendAlreadyExists);

    user.friends = user.friends.concat(friendToAdd._id);
    await user.save((err, user) => {
        if (err)
        {
            return res.status(500).send({error: 'error adding user'})
        }
        else
        {
            return res.send(user)
        }
    })
})

app.get('/friends', auth, async (req, res) => {
    const user = req.user;
    const friends = await User.find({_id: { $in: user.friends}})

    res.send(friends);
})

// Get the scores of another user
app.get('/scores/other', async(req,res) => {
    const otherID = req.query.id;
    const otherName = req.query.username;
    if(!otherID && !otherName)
    {
        return res.status(400).send({error: 'please enter a user to search'});
    }

    let scores;
    // if an id was enter then search by ID
    if (otherID)
    {
        const other = await User.findOne({_id: otherID});
        scores = await Score.find({owner: other.username});
    }
    // if not then search by the name
    else if(otherName)
    {
        scores = await Score.find({owner: otherName});
    }

    if(!scores)
    {
        return res.status(400).send({error: 'Unable to find scores for this user'});
    }

    res.send(scores);
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


// What abilities are need for the developer in a game?
// The developer needs to be able to search the database for their game, finding all scores with a game ID.
// They need to be able to filter those scores in a certain order.
// They need to be able to toggle between showing the current users friends leaderboard and the global leaderboard.
// The user needs to be able to add friends
// The user needs to be able to log out
// 


// Website features
// user needs to be able to search for a certain game
// user needs to be able to see all their score and their friend scores
