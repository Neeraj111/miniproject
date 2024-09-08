const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/miniproject");
console.log("database sever is running")

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age:Number,
    email: String,
    password:String,
    profilePic:{
        type:String,
        default:"OIP.jpeg"
    },
    posts: [
        {
            type:mongoose.Schema.Types.ObjectId,// posts is an array of IDs
            ref:'post' //this means k jo posts array mei IDs hain vo post model ko refer karengi
        } 
    ]
});

module.exports = mongoose.model("user",userSchema);