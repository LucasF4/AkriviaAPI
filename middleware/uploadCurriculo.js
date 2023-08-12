const multer = require('multer')

module.exports = (multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, '../public/src/curriculos/')
        },
        filename: (req, file, cb) => {
            cb(null, Date.now().toString() + '_' + file.originalname)
        }
    }),
    fileFilter: (req, file, cb) => {
        const extensaoImg = ['application/pdf'].find(formatoAceito => formatoAceito == file.mimetype);

        if(extensaoImg){
            return cb(null, true)
        }

        return cb(null, false)
    }
}))