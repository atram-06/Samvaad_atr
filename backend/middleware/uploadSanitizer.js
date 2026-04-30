// Middleware to sanitize upload parameters and prevent argument injection
// Protects against GHSA-g4mf-96x5-5m2c vulnerability in Cloudinary

const sanitizeUploadParams = (req, res, next) => {
    try {
        // Sanitize filename if present
        if (req.file && req.file.originalname) {
            req.file.originalname = req.file.originalname
                .replace(/[&;`|*?~<>^()[\]{}$\n\r]/g, '_')
                .trim();
        }

        // Sanitize any body parameters that might be passed to Cloudinary
        if (req.body) {
            Object.keys(req.body).forEach(key => {
                if (typeof req.body[key] === 'string') {
                    req.body[key] = req.body[key]
                        .replace(/[&;`|*?~<>^()[\]{}$\n\r]/g, '_')
                        .trim();
                }
            });
        }

        next();
    } catch (error) {
        console.error('Upload sanitization error:', error);
        next(); // Continue even if sanitization fails
    }
};

module.exports = { sanitizeUploadParams };
