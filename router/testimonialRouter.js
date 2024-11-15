const express = require("express");
const router = express.Router();
const {
    createOrUpdateTestimonialByUserId,
    updateTestimonialStatus,
    getAllTestimonials,
    getActiveTestimonials,
    deleteTestimonial,
    getTestimonialByUserId,
    updateTestimonialByUserId,
} = require("../controller/testimonialController"); // Adjust the import path
const checkLogin = require("../middleware/checkLogin");

router.get("/active", getActiveTestimonials);
router.post("/upsert/:userId", checkLogin("user"), createOrUpdateTestimonialByUserId);
router.put("/:testimonialId", checkLogin("admin"), updateTestimonialStatus);
router.delete("/:id", checkLogin("admin"), deleteTestimonial);
router.get("/all", checkLogin("admin"), getAllTestimonials);
router.get("/user/:userId", checkLogin("user"), getTestimonialByUserId);
router.put("/user/:userId", checkLogin("user"), updateTestimonialByUserId);

module.exports = router;
