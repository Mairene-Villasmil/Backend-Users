const mongoose = require("mongoose")

mongoose.connect(process.env.MONGO_URI_USER,{
    useUnifiedTopology: true,
    useNewUrlParser: true,
})

.then(()=>console.log("Database Contected"))
.catch(err => console.error(err))