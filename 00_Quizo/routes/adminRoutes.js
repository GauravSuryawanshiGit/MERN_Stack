const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { isAdmin } = require("../middleware/admin");
const upload = require("../middleware/upload");

router.get("/", isAdmin, adminController.getAdmin);
router.post("/add", isAdmin, adminController.postAdd);
router.get(
    "/delete/:id",
    isAdmin,
    adminController.deleteQuestion
);
router.get(
    "/edit/:id",
    isAdmin,
    adminController.getEditQuestion
);

router.post(
    "/edit/:id",
    isAdmin,
    adminController.postEditQuestion
);

router.post(
    "/import",
    isAdmin,
    upload.single("excelFile"),
    adminController.importQuestions
);

module.exports = router;
