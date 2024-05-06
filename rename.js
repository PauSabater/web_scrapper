import fs from "fs/promises"
import path from "path"

import { fileURLToPath } from "url"
import fss from "fs"
// import { verbsList } from "./list"


const __dirname = path.dirname(fileURLToPath(import.meta.url))

function changeJsonFileNames(directoryPath) {

    console.log("hey nodee")

    fs.readdir(directoryPath, (err, files) => {

        console.log('reading')
        console.log(files)


        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        files.forEach(file => {
            console.log('heyy'+file)

            const filePath = path.join(directoryPath, file);
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading file:', err);
                    return;
                }

                try {
                    const jsonData = JSON.parse(data);
                    const newFileName = jsonData._id + '.json';
                    const newFilePath = path.join(directoryPath, newFileName);

                    fs.rename(filePath, newFilePath, err => {
                        if (err) {
                            console.error('Error renaming file:', err);
                            return;
                        }
                        console.log(`Renamed ${filePath} to ${newFilePath}`);
                    });
                } catch (parseErr) {
                    console.error('Error parsing JSON:', parseErr);
                }
            });
        });
    });
}

// Example usage:
const directoryPath = path.join(__dirname, 'storage', 'datasets', 'default');
// console.log(directoryPath)
changeJsonFileNames(directoryPath);
