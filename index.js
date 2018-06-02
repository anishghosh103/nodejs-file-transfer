const fs = require('fs');
const path = require('path');

const utils = require('./utils');

init();

function init() {
  inputSourceDirectoryName()
    .then(displayAllFilesFromDirectory)
    .then(inputSerialNumberOfFileToCopy)
    .then(inputDestinationDirectoryName)
    .then(copyFile)
    .then(result => console.log(result.message))
    .catch(err => console.log(err && err.message ? err.message : ''));
}

function inputSourceDirectoryName() {
  return utils.promise(cb => {
    utils.prompt('Enter source directory name: ', (input) => {
      return validateDirectory(input, (err) => {
        if (err) {
          console.log(err);
          return true;
        }
        cb.set('sourceDirectory', input);
        cb.success();
      });
    });
  });
}

function displayAllFilesFromDirectory(obj) {
  console.log();
  const sourceDirectory = obj.sourceDirectory;
  return utils.promise(cb => {
    fs.readdir(sourceDirectory, (err, files) => {
      if (err) {
        cb.set('message', err.message);
        cb.err();
      } else {
        // filter only files
        files = files.filter(file => {
          const filepath = path.join(sourceDirectory, file);
          try {
            const stat = fs.statSync(filepath);
            if (stat.isFile()) { return true; }
          } catch (err) {
            return false;
          }
        });
        // show files
        if (files.length) {
          let index = 1;
          console.log('Files in the directory:');
          files.forEach(file => console.log(`${index++}. ${file}`));
          cb.set('files', files);
          cb.success();
        } else {
          cb.set('message', '0 files found');
          cb.err();
        }
      }
    });
  }, obj);
}

function inputSerialNumberOfFileToCopy(obj) {
  console.log();
  return utils.promise(cb => {
    utils.prompt('Enter serial number of the file to be copied: ', (input) => {
      if (input === 'exit') {
        cb.err();
        return;
      }
      input = Number(input);
      if (!input) {
        console.log('Please enter a number.');
        return true;
      } else if (input < 1 || input > obj.files.length) {
        console.log(`Serial Number should be between 1 and ${obj.files.length}`);
        return true;
      } else {
        cb.set('fileIndex', input - 1);
        cb.success();
      }
    });
  }, obj);
}

function inputDestinationDirectoryName(obj) {
  console.log();
  return utils.promise(cb => {
    utils.prompt('Enter destination directory name: ', (input) => {
      if (input === obj.sourceDirectory) {
        console.log('Destination directory is same as Source Directory.');
        return true;
      }
      return validateDirectory(input, (err) => {
        if (err) {
          console.log(err);
          return true;
        }
        cb.set('destinationDirectory', input);
        cb.success();
      });
    });
  }, obj);
}

function copyFile(obj) {
  console.log();
  return utils.promise(cb => {
    const filename = obj.files[obj.fileIndex];
    const srcFilePath = path.join(obj.sourceDirectory, filename);
    const destFilePath = path.join(obj.destinationDirectory, filename);
    
    const highWaterMark = 16 * 1024;
    const readStream = fs.createReadStream(srcFilePath, { highWaterMark });
    const writeStream = fs.createWriteStream(destFilePath, { highWaterMark });

    let fileSize;
    try {
      fileSize = fs.statSync(srcFilePath).size;
    } catch (err) {
      fileSize = 0;
    }

    readStream.on('error', (err) => {
      cb.set('message', err.message);
      cb.err();
    });
    readStream.on('end', () => {
      readStream.destroy();
      writeStream.end();
      console.log(progress(100));
      cb.set('message', 'File copied successfully.');
      cb.success();
    });
    writeStream.on('error', (err) => {
      cb.set('message', err.message);
      cb.err();
    });
    let bytesWritten = 0;
    readStream.on('data', (chunk) => {
      bytesWritten += highWaterMark;
      if (fileSize) {
        const percentage = parseInt(bytesWritten / fileSize * 100);
        process.stdout.write(`${progress(percentage)}\r`);
      }
      writeStream.write(chunk);
    });
    function progress(percentage) {
      const length = process.stdout.columns - 3;
      let progress = '[';
      for (let i = 0; i < length; i++) {
        progress += (i * 100 / length) < percentage ? '#' : '-';
      }
      progress += ']';
      return progress;
    }
  });
}

function validateDirectory(dirName, callback) {
  try {
    const stats = fs.statSync(dirName);
    if (stats.isDirectory()) {
      return callback(null);
    } else {
      return callback('Directory does not exist.');
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      return callback('Directory does not exist.');
    } else {
      return callback(err.message);
    }
  }
}
