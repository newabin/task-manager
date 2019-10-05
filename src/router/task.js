const express = require('express')
const Task = require('../models/task')
const User = require('../models/users')
const router = new express.Router()
const auth = require('../middleware/auth')


router.post('/tasks', auth, async (req, res)=>{
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try{
        await task.save()
        res.status(201).send(task)
    }catch(e){
        res.status(400).send(e)
    }

    // const task = new Task(req.body)

    // task.save().then(()=>{
    //     res.status(201).send(task)
    // }).catch((error)=>{
    //     res.status(400).send(error)
    // })
})

router.get('/tasks', auth, async (req,res)=>{
    const match = {}
    const sort = {}
    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }
    if(req.query.sortBy){
        const parts =req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try{
        //const task = await Task.find({owner : req.user._id})
        await req.user.populate({
            path : 'mytasks',
            match,
            options : {
                limit : parseInt(req.query.limit),
                skip : parseInt(req.query.skip),
                sort
            } 
        }).execPopulate()
        
        res.send(req.user.mytasks)
    }catch(e){
        res.status(500).send()
    }

    // Task.find({}).then((tasks)=>{
    //     res.send(tasks)
    // }).catch((error)=>{
    //     res.status(500).send()
    // })
})

router.get('/tasks/:id', auth, async (req, res)=>{
    const _id = req.params.id
    try{
        const task = await Task.findOne({_id, owner : req.user._id})
        
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send()
    }

    // Task.findById(req.params.id).then((task)=>{
    //     if(!task){
    //         return res.status(404).send()
    //     }

    //     res.send(task)
    // }).catch((error)=>{
    //     res.status(500).send()
    // })
})


router.patch('/tasks/:id', auth, async (req, res)=>{
    const updateTask = Object.keys(req.body)
    const validUpdate = ['description', 'completed']
    const isValidOperation = updateTask.every((update)=> validUpdate.includes(update))
    if(!isValidOperation){
        return res.status(400).send({error : 'Invalid Value!'})
    }
    try{
        const task = await Task.findOne({_id : req.params.id, owner : req.user._id})
        //const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new : true, runValidators : true})
        if(!task){
            return res.status(400).send()
        }
        updateTask.forEach((update)=>task[update] = req.body[update])
        await task.save()
        res.send(task)
    }catch(e){
        res.status(400).send(e)
    }

})

router.delete('/tasks/:id', auth, async (req,res)=>{
    try{
        const deleteTask = await Task.findOneAndDelete({_id : req.params.id, owner : req.user._id})
        if(!deleteTask){
            res.status(404).send()
        }
        res.send(deleteTask)
    }catch(e){
        res.status(500).send()
    }
})

module.exports = router