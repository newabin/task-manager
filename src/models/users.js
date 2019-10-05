const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
        trim : true
    },
    email : {
        type : String,
        unique : true,
        required : true,
        trim : true,
        lowercase : true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Please enter valid Email')
            }
        }
    },  
    age : {
        type : Number,
        default : 0,
        validate(value){
            if(value<0){
                throw new Error('You must be in the form of drop')
            }
        }
        
    },
    password : {
        type : String,
        required : true,
        trim : true,
        minlength : 7,
        validate(value){
            if(value.toLowerCase().includes("password")){
                throw new Error("please choose strong password")
            }
        }
    },
    tokens : [{
        token : {
            type : String,
            required : true
        }
    }],
    avatar : {
        type : Buffer
    }
},{
    timestamps : true
})

userSchema.virtual('mytasks',{
    ref : 'Task',
    localField: '_id',
    foreignField : 'owner'
})
//
userSchema.methods.toJSON = function(){
    const user = this

    const userObject = user.toObject()
    
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    
    return userObject
}

userSchema.methods.createAuthToken = async function(){
    const user = this

    const token = jwt.sign({ _id : user._id.toString() }, process.env.JWT_SECRET,{ expiresIn : '7 days'})
    
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.statics.findByCredentials = async (email, password)=>{
    const user = await User.findOne({email})

    if(!user){
        throw new Error('Unable to find email')
    }

    const match = await bcrypt.compare(password, user.password)

    if(!match){
        throw new Error('Password didnt match')
    }

    return user
}




//hash the password before saving
userSchema.pre('save', async function(next){
    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()

})

userSchema.pre('remove', async function(next){
    const user = this

    await Task.deleteMany({ owner : user._id })

    next()
})

const User = mongoose.model('User',userSchema) 

module.exports = User