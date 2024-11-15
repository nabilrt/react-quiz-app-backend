const mongoose = require("mongoose");

const TestimonialSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to a user document
        required: true,
        ref: "User", // Replace 'User' with the name of your user model
        unique: true, // Ensures each user can have only one testimonial
    },
    text: {
        type: String,
        required: true,
        maxlength: 500,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    status: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Testimonial = mongoose.model("Testimonial", TestimonialSchema);

module.exports = Testimonial;
