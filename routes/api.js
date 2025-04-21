'use strict';

const { request } = require('chai');
const { query } = require('express');
const { ObjectId } = require('mongodb');

const testId = new ObjectId();

module.exports = function (app, myDataBase) {
  console.log('Database instance:', myDataBase);
  app.route('/api/issues/:project')
  
    .get( async function (req, res){
      let project = req.params.project;
      
      try {

        let filter = {project: project, ...req.query}
          console.log('issues query', filter);
         
          if(req.query.open !== undefined){
           query.open === true
         }

         if (req.query._id){

          try {
            filter._id = new ObjectId(req.query._id);
            console.log(filter._id)

          }catch (err) {
          return  res.status(400).json({error: 'invalid _id input'})
          }
         }
         

        let projectIssues = await myDataBase.find(filter).toArray()
         
        console.log('Retrieved issues:', projectIssues)

         if(projectIssues.length === 0) {
           return res.status(500).json({error: 'couldnt find any issues for that project'})
         }
      
         return res.json(projectIssues)
      
        } catch (err) {
          console.log('error finding project issues', err)
          return res.status(500).json({error: 'error retrieving files for that project'});
        }
    })
    
    .post( async function (req, res){
      let project = req.params.project;
      let timestamp = new Date();

       if (req.body.issue_title == null || req.body.issue_text == null || req.body.created_by == null) {
       return res.json({ error: 'required field(s) missing' });
       } 

       try{

      let insertResult = await myDataBase.insertOne({ 
        project,
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_by: req.body.created_by,
          created_on: timestamp,
          updated_on: timestamp,
          assigned_to: req.body.assigned_to || '',
          open: true,
          status_text: req.body.status_text || ''
        })
        console.log('issue added to db', insertResult);

        if(!insertResult.acknowledged){
          return res.status(500).json({error: 'inserting into db'})
        }

        let newIssue = await myDataBase.findOne({_id: insertResult.insertedId})

        if (!newIssue) {
          return res.status(500).json({error: 'could not find inserted data'})
        }
      
       return res.json(newIssue);

        } catch (error) {
          console.log('error insert into database', error);
        return  res.status(500).json({error: 'database error'})
        }
       })

      
      
    .put(async function (req, res){
      let timestamp = new Date();

      if(!req.body._id){
        console.log('no id given', req.body._id)
        return res.json({error: 'missing _id'})
      }

      let issueId
      try {
       issueId = new ObjectId(req.body._id)
        console.log('update issue _id object', issueId)
      }catch (err){
        return res.status(400).json({error: 'invalid _id'})
      }

      

      let updateFields = {};
       Object.keys(req.body).forEach(key => {
        if (key !== '_id' && req.body[key] !== '' && req.body[key] !== undefined){
          
          updateFields[key] = req.body[key]
          console.log('update fields and key', updateFields[key], req.body[key])
        }
      })

      
      if (Object.keys(updateFields).length === 0) {
        console.log('updatefieldslength is 0', req.body._id)
        return res.json({error: 'no update field(s) sent', '_id': req.body._id})
      }

      updateFields.updated_on = timestamp;
try{
    
     let result = await myDataBase.findOneAndUpdate(
        {_id: issueId},
        {$set: updateFields},
        {returnDocument: 'after'}
      )
console.log(result)

    
      if(!result) {
        console.log('error updating', result)
        return res.json({error: 'could not update', '_id': req.body._id})
      }
    
      
     return res.json({result: 'successfully updated', '_id': req.body._id})  
   } catch (err) {
    console.log('error updating', err)
    return res.json({error: 'could not update', '_id': req.body._id})
   } 

    })
    
    .delete(async function (req, res){
      let project = req.params.project;
     
      if(!req.body._id){
       console.log('missing _id', req.body._id)
       return res.json({error: 'missing _id'})
      }   

      let idToDelete 
      try {
        idToDelete = new ObjectId(req.body._id)
      }catch (err) {
        return res.status(400).json({error : 'could not delete', '_id': req.body._id})
      }
    

      try{
      let deleteResult = await myDataBase.findOneAndDelete({ _id: idToDelete})
      console.log('id found', idToDelete);
     console.log('delete result', deleteResult)
      
       if(!deleteResult){
       return res.json({error: 'could not delete', '_id': req.body._id});
       }
      


      return res.json({result: 'successfully deleted', '_id': req.body._id});
      } catch(e) {
        console.log('error deleting', e)
       return res.json({error: 'could not delete', '_id': req.body._id})
      }
   
      
    })
    
};
