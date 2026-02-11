const ImageKit = require("imagekit");

let imagekit;
try {
    if (process.env.IMAGEKIT_PUBLIC_KEY) {
        imagekit = new ImageKit({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
        });
    } else {
        console.warn("WARNING: ImageKit keys missing in .env. Image uploads will fail.");
        // Create a dummy object to prevent immediate crash, method calls will throw
        imagekit = {
            upload: async () => { throw new Error("ImageKit not configured"); }
        };
    }
} catch (error) {
    console.error("ImageKit Init Error:", error.message);
    imagekit = {
        upload: async () => { throw new Error("ImageKit initialization failed"); }
    };
}

module.exports = imagekit;
