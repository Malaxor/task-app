const multer = require('multer');

const upload = multer({ 
  // dest: 'avatar',
  limits: {
    fileSize: 1_000_000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpeg|jpg|png)$/i)) {
      return cb(new Error('Please upload an image file.'));
    }
    cb(undefined, true);
  } 
});

module.exports = upload;