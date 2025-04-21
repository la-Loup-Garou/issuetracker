'use strict';
require('dotenv').config
const { MongoClient } = require('mongodb');



async function main(callback){
 const URI = process.env.MONGO_URI
 const client = new MongoClient(URI);

 try {
    await client.connect();

    console.log('connected to db');
    
    await callback(client)
 } catch(e){
    console.log('error connecting to db', e);

    throw new Error('error', e);
 }

}

module.exports = main