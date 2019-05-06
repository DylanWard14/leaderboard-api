# Leaderboard API

This API is currently in development. It is intended to be used by game developers to help them in creating online leaderboards. Currently this is only run locally but is intended to be run on a webserver, allowing users to connect online. Users can add friends and see their scores from every game that has implemented the leaderboard system.

# Setup
Ensure that Node.js is installed and MongoDB is installed and running on port 27017 and then run the following commands
    
    <project_root>
    npm install
    node ./src/app.js
    
This will start up the server on ```localhost:3000``` for your game to connect to.
But first you need to add your game to the database and generate an ID for it.
## Add Your Game to the Database
1. install the postman rest-api tool from ```https://www.getpostman.com/downloads/```
2. Once postman is installed import the ```Leaderboard-api.postman_collection.json``` file
3. Open the ```Leaderboard-api``` collection in postman and navigate to the create game task.
4. Inside the body section fill in your games title and description then press send
5. you should see created game down the bottom, meaning that your game is added to the database.

Note: In the future this will be done through a web interface.

# Usage (This is in development)
Now add the unity template package into your unity project.
Replace the temp game id with the one that you just generated and you should be good to go.
If you do not have an account you will be able to create a user from within your unity project...