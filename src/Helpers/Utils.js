const { lstatSync, readdirSync } = require("fs");
const { join, extname, } = require("path");

module.exports = class Utils {
    static createUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    static recursiveReadDirSync(dir, allowedExtensions = [".js"]) {
        const filePaths = [];
        const readCommands = (dir) => {
            const files = readdirSync(join(process.cwd(), dir));
            files.forEach((file) => {
                const stat = lstatSync(join(process.cwd(), dir, file));
                if (stat.isDirectory()) {
                    readCommands(join(dir, file));
                } else {
                    const extension = extname(file);
                    if (!allowedExtensions.includes(extension)) return;
                    const filePath = join(process.cwd(), dir, file);
                    filePaths.push(filePath);
                }
            });
        };
        readCommands(dir);
        return filePaths;
    }
};