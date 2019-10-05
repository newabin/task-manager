const express = require('express')
const User = require('../models/users')
const auth = require('../middleware/auth')
const router = new express.Router()
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendDeactivateEmail }= require('../emails/account')

router.post('/users', async (req, res)=>{
    const user = new User(req.body)

    try{
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.createAuthToken()
        res.status(201).send({user, token})
    }catch(e){
        res.status(400).send(e)
    }

    // user.save().then(()=>{
    //     res.status(201).send(user)
    // }).catch((error)=>{
    //     res.status(400).send(error)
    // })
})

router.post('/users/login', async (req,res)=>{
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.createAuthToken()

        res.send({user, token})
        
    }catch(e){
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token

        })
        await req.user.save()

        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.post('/users/logoutALL', auth, async (req,res)=>{
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res)=>{

    res.send(req.user)
    // try{
    //     const users = await User.find({})
    //     res.status(201).send(users)
    // }catch(e){
    //     res.status(500).send()
    // }
    // User.find({}).then((users)=>{
    //     res.send(users)
    // }).catch((error)=>{
    //     res.status(500).send()
    // })
})


router.patch('/users/me', auth, async (req, res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdate = ['name','password','age']
    const isValidOperation = updates.every((update)=> allowedUpdate.includes(update))


    if(!isValidOperation){
        
        return res.status(400).send({error : 'Invalid Updates!'})
    }

    try{
        updates.forEach((update)=>req.user[update] = req.body[update])
        await req.user.save()
        //const updateUser = await User.findByIdAndUpdate(req.params.id, req.body, {new : true, runValidators : true})
        res.send(req.user)
    }catch(e){
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req,res)=>{
    try{
        await req.user.remove()
        sendDeactivateEmail(req.user.email, req.user.name)
        res.send(req.user)
    }catch(e){
        res.status(500).send()
    }
})
const upload = multer({
    limits : {
        fileSize : 2000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.toLowerCase().match(/\.(png|jpg|jpeg)$/)){
            return cb(new Error('Please upload an image'))
        }
        
        cb(undefined, true)

    }
}) 



router.post('/users/me/avatar', auth, upload.single('avatar'), async (req,res)=>{
    
    const buffer = await sharp(req.file.buffer).resize({ width : 400, height : 400 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
},(error,req,res,next)=>{
    res.status(404).send({error : error.message})
})

router.delete('/users/me/avatar', auth, async (req,res)=>{
    try{
        req.user.avatar = undefined
        await req.user.save()
        res.send()
    
    }catch(e){
        res.status(400).send(e)
    }
})

router.get('/users/:id/avatar', async (req,res)=>{
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }


        res.set('Content-Type','image/png')
        res.send(user.avatar)
    }catch(e){
        res.status(404).send()
    }
})

 module.exports = router