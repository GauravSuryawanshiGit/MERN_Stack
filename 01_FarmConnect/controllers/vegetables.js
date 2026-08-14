const Vegetable = require("../models/vegetable.js");

module.exports.indexVegetable = async (req, res, next) => {
    try {
        if (req.query.search && req.query.search.length > 0) {
            let searchQ = req.query.search;
            let searchVegetables = await Vegetable.find({ title: { $regex: searchQ, $options: "i" } }) // Case-insensitive search
                .collation({ locale: "en", strength: 2 });

            if (searchVegetables.length === 0) {
                req.flash("error", "Vegetable does not exist!");
                return res.redirect("/vegetables");
            }
            return res.render("vegetables/search.ejs", { searchVegetables, searchQ });
        } else {
            // Fetch all vegetables and sort by createdAt (newest first)
            const allVegetables = await Vegetable.find().sort({ createdAt: -1 });
            res.render("vegetables/index.ejs", { allVegetables });
        }
    } catch (err) {
        next(err);
    }
};

module.exports.newVegetable = (req, res) => {
    res.render("vegetables/new.ejs");
};

module.exports.createVegetable = async (req, res, next) => {
    try {
        let url = req.file.path;
        let filename = req.file.filename;

        let newVegetable = new Vegetable(req.body);
        newVegetable.owner = req.user._id;
        newVegetable.image = { url, filename };
        await newVegetable.save();

        req.flash("success", "New Vegetable Created!");
        res.redirect("/vegetables");
    } catch (err) {
        next(err);
    }
};

module.exports.showVegetable = async (req, res, next) => {
    try {
        let { id } = req.params;
        const vegetable = await Vegetable.findById(id)
            .populate({ path: "reviews", populate: { path: "author" } })
            .populate("owner");

        if (!vegetable) {
            req.flash("error", "Vegetable does not exist!");
            return res.redirect("/vegetables");
        }
        res.render("vegetables/show.ejs", { vegetable });
    } catch (err) {
        next(err);
    }
};

module.exports.editVegetable = async (req, res, next) => {
    try {
        let { id } = req.params;
        const vegetable = await Vegetable.findById(id);

        if (!vegetable) {
            req.flash("error", "Vegetable does not exist!");
            return res.redirect("/vegetables");
        }
        res.render("vegetables/edit.ejs", { vegetable });
    } catch (err) {
        next(err);
    }
};

module.exports.updateVegetable = async (req, res, next) => {
    try {
        let { id } = req.params;
        await Vegetable.findByIdAndUpdate(id, { ...req.body });

        req.flash("success", "Vegetable Updated!");
        res.redirect(`/vegetables/${id}`);
    } catch (err) {
        next(err);
    }
};

module.exports.deleteVegetable = async (req, res, next) => {
    try {
        let { id } = req.params;
        await Vegetable.findByIdAndDelete(id);

        req.flash("success", "Vegetable Deleted!");
        res.redirect("/vegetables");
    } catch (err) {
        next(err);
    }
};
