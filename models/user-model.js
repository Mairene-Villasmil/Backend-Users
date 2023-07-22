const mongoose =  require('mongoose')

const userSchema =  new mongoose.Schema({
    firstName:{type:String, required:true},
    lastName:{type:String, required:true},
    email:{type:String, required:true},
    password:[{type:String, required:true}], 
    from:{type:Array, required:true},
    uniqueString:{type:String, required:true},
    emailVerificado:{type:Boolean, required:true},
    isConected:{type:Boolean},
    lastConection:{type:Date}
    
})

const User = mongoose.model('users', userSchema)
module.exports = User