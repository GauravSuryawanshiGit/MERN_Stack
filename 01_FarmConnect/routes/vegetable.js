const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isOwner, isFarmer, isAuth } = require("../middleware.js");
const vegetableController = require("../controllers/vegetables.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router
  .route("/")
  .get(wrapAsync(vegetableController.indexVegetable)) // Sorted in the controller
  .post(isAuth, isFarmer, upload.single("image"), wrapAsync(vegetableController.createVegetable));

router.get("/new", isAuth, isFarmer, vegetableController.newVegetable);

router
  .route("/:id")
  .get(wrapAsync(vegetableController.showVegetable))
  .put(isAuth, isFarmer, isOwner, wrapAsync(vegetableController.updateVegetable));

router.get("/:id/edit", isAuth, isFarmer, isOwner, wrapAsync(vegetableController.editVegetable));

module.exports = router;
