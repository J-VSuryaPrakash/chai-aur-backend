import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
    // it is better to have different file name since the files may get overwritten due to 
    // same file name - 
}
})

const upload = multer({ storage: storage })