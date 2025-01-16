import multer from "multer";

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./public/temp"); // Directory to store files
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname); // Retain original file name
    }
});

// Create the upload middleware
export const upload = multer({ storage });
