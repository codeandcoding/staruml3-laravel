/*
 * Copyright (c) 2018 @cesiztel All rights reserved.
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

const migrationGenerator = require('./migrations/code-generator');

/**
 * Helper function to return the base model
 *
 * @return {Object} model
 */
function _getBase(callback) {
    app.elementPickerDialog.showDialog('Select a base model to generate codes', 
        null, type.ERDDiagram).then(callback);
}

/**
 * Helper function to return the path
 * where the user wants to save the files
 * generated.
 *
 * @return {string} path
 */
function _askForPath() {
    var files = app.dialogs.showOpenDialog('Select a folder where generated codes to be located', null, null, { properties: [ 'openDirectory' ] });
    if (files && files.length > 0) {
        return files[0];
    }
}

/**
 * Command Handler for Laravel migration code Generation
 *
 * @param {Element} base
 * @param {string} path
 * @param {Object} options
 */
function _handleMigrationsGenerate (base, path, options) {
    path = (!path) ? _askForPath() : path;
    if (!path) {
        // user cancel operation
        return;
    }

    if (!base) {
        _getBase(function ({buttonId, returnValue}) {
            if (buttonId === 'ok') {
                base = returnValue;
                migrationGenerator.generate(base, path, options);
            }
        });
    } else {
        migrationGenerator.generate(base, path, options);
    }    
}

/**
 * Command Handler for Laravel models code Generation
 *
 * @param {Element} base
 * @param {string} path
 * @param {Object} options
 */
function _handleModelsGenerate (base, path, options) {
    // TODO: trigger to generate models
}

function init () {
    app.commands.register('laravel_migrations:generate', _handleMigrationsGenerate);
    app.commands.register('laravel_models:generate', _handleModelsGenerate);
}

exports.init = init;
