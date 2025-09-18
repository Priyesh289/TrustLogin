import mongoose from "mongoose";

const connectDB = async () => {

   mongoose.connection.on('connected', () => console.log('DataBase connect'));
   mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
   });

   await mongoose.connect(`${process.env.MONGODB_URI}/mern-auth`)
}

export default connectDB;