const mongoose=require("mongoose");
require("dotenv").config();

exports.connect=() => {
    mongoose.connect(process.env.MONGODB_URL,{
        useNewUrlParser:true,
        useUnifiedTopology:true,
    })


    .then(()=> console.log("DB Connected Succesfully"))
    
    .catch((error)=>{
        console.log("Db Connnection failed");
        console.error(error);
        process.exit(1);
    })
};


