const express = require('express')
const MongoClient = require('mongodb').MongoClient
const app = express()
const port = 3333

// MongoDB Options
const mongo_url = "mongodb://localhost:27017/";		// mongodb url
const database = 'space';										// name of database
const collection = 'astronauts';									// name of collection
const options = {useUnifiedTopology: true}; // mongodb options
const client = new MongoClient( mongo_url, options);

process.on('warning', e => console.warn(e.stack));

app.use( express.json() ); 	      	// enable parsing of JSON data

app.use('/astronauts', express.static('public')); /// this makes the frontend available.

// Endpoint listens for requests from the frontend, 
// fetches  current atronauts from mongo
// and returns them to the frontend.
 client.connect(err => {
  if (err) { console.log(err) }
 app.get('/astronauts/current', (req, res) => {
  client.db(database).collection(collection)
  .find( {} )
  .toArray( (err, item) => {
    if (err) { res.send({ 'error': 'An error has occured' }) }
    else { res.send( item ) }		// send the result back.
  })
 })
})

app.listen(port, () => console.log(`Listening on port ${port}!`))
