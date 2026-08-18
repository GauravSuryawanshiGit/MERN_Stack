const mongoose = require("mongoose");

const connectDB = async () => {
    /*Successfully Connect to mongoDB*/ try {
        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log("MongoDB Atlas Connected");

    } /*Failure to Connect to mongoDB*/catch (err) {

        console.log(
            "Database Connection Error:",
            err.message /*Print error msg*/
        );

        process.exit(1); /*When failure occurs to connect with DB exit and terminate application*/
    }
};

module.exports = connectDB; /*make connectDB available to other JS files*/