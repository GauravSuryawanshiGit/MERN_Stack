const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
    storage
});

module.exports = upload;

const profileUpload = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024
    },
    fileFilter: (req, file, callback) => {
        const allowedTypes = [
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            return callback(null, true);
        }

        callback(new Error("Only image files are allowed."));
    }
});

module.exports.profileUpload = profileUpload;