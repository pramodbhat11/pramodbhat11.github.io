const express = require("express");
const router = express.Router();
const aiService = require("../utils/ai");

// Render Form
router.get("/crop-info", (req, res) => {
    res.render("crop-info", {
        currentUser: req.user,
        result: null,
        cropName: null
    });
});

// Handle Query
router.post("/crop-info", async (req, res) => {
    try {
        const { cropName } = req.body;
        if (!cropName) {
            req.flash("error", "Please enter a crop name");
            return res.redirect("/crop-info");
        }

        const aiResult = await aiService.getCropDetails(cropName);

        // Convert Markdown to HTML logic could be here, or just render MD in frontend if using a library.
        // For simplicity, we'll pass the raw markdown text and handle it in EJS or just display it cleanly.

        res.render("crop-info", {
            currentUser: req.user,
            result: aiResult,
            cropName: cropName
        });

    } catch (error) {
        console.error("AI Route Error:", error);
        req.flash("error", "Could not fetch details. Try again later.");
        res.redirect("/crop-info");
    }
});

module.exports = router;
