/*
 * Copyright (c) 2018 @cesiztel. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

 const fs = require('fs');

 class FileManager {

    /**
     * @constructor
     *
     * @param {string} basePath generated files and directories to be placed
     * @param {string} options
     */
    constructor (basePath, options) {
        /** @member {type.Model} */
        this.basePath = basePath;

        /** @member {string} */
        this.options = options;

        /** @member {string} */
        this.migrationsFullPath = basePath + '/migrations';

        /** @member {string} */
        this.modelsFullPath = basePath;
    }
    
    getBasePath () {
        return this.basePath;
    }

    getMigrationsFullPath() {
        return this.migrationsFullPath;
    }

    getModelsFullPath() {
        return this.modelsFullPath;
    }

    getOptions() {
        return this.options;
    }

    prepareMigrationsFolder(onPrepared, onPreparedCancel) {
        if (fs.existsSync(this.migrationsFullPath)){
            var buttonId = app.dialogs.showConfirmDialog("Exist a folder with the same name, overwrite?");
            if (buttonId != 'ok') {
                onPreparedCancel();

                return;
            }

            this.deleteFolderRecursive(this.migrationsFullPath);
        }

        fs.mkdirSync(this.migrationsFullPath);

        onPrepared();
    }

    deleteFolderRecursive(path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function(file, index){
                var curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) { 
                    deleteFolderRecursive(curPath);
                } else { 
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }
}

exports.FileManager = FileManager;
