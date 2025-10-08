import mongoose from "mongoose";

const connectDB = async () => {
   try {
      // Connect to MongoDB first
      await mongoose.connect(process.env.MONGODB_URI);
      // Once connected successfully
      console.log("MongoDB connected successfully");
   } catch (error) {
      console.error("MongoDB connection failed:", error);
      process.exit(1); // Exit process if DB connection fails
   }
}

export default connectDB;