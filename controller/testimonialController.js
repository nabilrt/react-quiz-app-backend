const Testimonial = require("../models/Testimonial"); // Import the model

const createOrUpdateTestimonialByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const { text, rating, status } = req.body;
        const testimonial = await Testimonial.findOneAndUpdate(
            { userId },
            { text, rating, status },
            { new: true, upsert: true, setDefaultsOnInsert: true } // Create a new document if it doesn't exist
        );

        res.status(200).json(testimonial);
    } catch (error) {
        console.error("Error Creating or Updating Testimonial:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const updateTestimonialStatus = async (req, res) => {
    try {
        const { testimonialId } = req.params;
        const testimonial = await Testimonial.findById(testimonialId);
        const updatedTestimonial = await Testimonial.findByIdAndUpdate(
            testimonialId,
            { status: !testimonial.status },
            { new: true } // Return the updated document
        );
        if (!updatedTestimonial) {
            return res.status(404).json({ message: "Testimonial not found" });
        }

        res.status(200).json({
            message: "Testimonial updated successfully",
            updatedTestimonial,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update Testimonial",
            error: error.message,
        });
    }
};

const deleteTestimonial = async (req, res) => {
    try {
        const { testimonialId } = req.params;
        const deletedTestimonial = await Testimonial.findByIdAndDelete(
            testimonialId
        );
        if (!deletedTestimonial) {
            return res.status(404).json({ message: "Testimonial not found" });
        }
        res.status(200).json({
            message: "Testimonial deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete Testimonial",
            error: error.message,
        });
    }
};

const getActiveTestimonials = async (req, res) => {
    try {
        const activeTestimonials = await Testimonial.find({
            status: true,
        }).populate("userId");
        res.status(200).json({
            message: "Active Testimonial fetched successfully",
            activeTestimonials,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch Testimonial",
            error: error.message,
        });
    }
};

const getAllTestimonials = async (req, res) => {
    try {
        const allTestimonials = await Testimonial.find().populate("userId"); // No filter to fetch all
        res.status(200).json({
            message: "All Testimonial fetched successfully",
            allTestimonials,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch Testimonial",
            error: error.message,
        });
    }
};

const getTestimonialByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        const testimonial = await Testimonial.findOne({ userId });
        if (!testimonial) {
            return res
                .status(404)
                .json({ message: "Testimonial not found for this user." });
        }

        res.status(200).json(testimonial);
    } catch (error) {
        console.error("Error Fetching Testimonial By User ID:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const updateTestimonialByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const { text, rating, status } = req.body;

        const updatedTestimonial = await Testimonial.findOneAndUpdate(
            { userId },
            { text, rating, status },
            { new: true } // Return the updated document
        );

        if (!updatedTestimonial) {
            return res
                .status(404)
                .json({ message: "Testimonial not found for this user." });
        }

        res.status(200).json(updatedTestimonial);
    } catch (error) {
        console.error("Error Updating Testimonial By User ID:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    createOrUpdateTestimonialByUserId,
    updateTestimonialStatus,
    deleteTestimonial,
    getActiveTestimonials,
    getAllTestimonials,
    getTestimonialByUserId,
    updateTestimonialByUserId,
};
