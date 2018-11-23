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

const fs = require('fs');
const path = require('path');
const codegen = require('./utils/codegen-utils');
const fileUtils = require('./utils/file-utils');
const codeClassGen = require('./code-class-generator');

/**
 *  Code Generator
 */
class LaravelMigrationCodeGenerator {

    /**
     * @constructor
     *
     * @param {type.UMLPackage} baseModel
     * @param {type.FileManager}
     */
    constructor (baseModel, fileManager) {
        /** @member {type.Model} */
        this.baseModel = baseModel;

        /** @member {type.FileManager} */
        this.fileManager = fileManager;
    }

    /**
     * Generate the file name. In Laravel the file name
     * is based on the following components.
     *
     * - Current date
     * - Table name
     *
     * Those components are used in the following
     * format:
     *
     * yyyy_mm_dd_hhmmss_create_[table_name]_table.php
     *
     * @param elem
     *
     * @returns {*}
     */
    generateFileName (elem) {
        var now = new Date();
        var terms = [];

        terms.push(now.getFullYear());
        // ("0" + "10").slice(-2) => "10" & ("0" + "9").slice(-2) => "09"
        terms.push(("0" + (now.getMonth() + 1)).slice(-2));
        terms.push(("0" + now.getDate()).slice(-2));
        var time = ("0" + now.getHours()).slice(-2) +
            ("0" + now.getMinutes()).slice(-2) +
            ("0" + now.getSeconds()).slice(-2);
        terms.push(time);
        terms.push('create');
        terms.push(elem.model.name);
        terms.push('table.php');

        return terms.join("_");
    }

    generateClassCode(codeWriter, elem) {
        var tableName = elem.model.name;
        var classCodeGenerator = this;

        var migrationClass = {
            name: 'Create' + (tableName.charAt(0).toUpperCase() + tableName.slice(1))  + 'Table',
            uses: [
                'Illuminate\\Support\\Facades\\Schema;',
                'Illuminate\\Database\\Schema\\Blueprint;',
                'Illuminate\\Database\\Migrations\\Migration;'
            ],
            methods: [
                {
                    'name': 'up',
                    'scope': 'public',
                    'description': 'Run the migrations.',
                    'params': [],
                    'returns': [{
                        "type": "void"
                    }],
                    body: function (codeWriter) {
                        classCodeGenerator.generateUpBody(codeWriter, tableName, elem);
                    }
                }, 
                {
                    'name': 'down',
                    'scope': 'public',
                    'description': 'Reverse the migrations.',
                    'params': [],
                    'returns': [{
                        "type": "void"
                    }],
                    body: function (codeWriter) {
                        classCodeGenerator.generateDownBody(codeWriter, tableName);
                    }
                }
            ]
        };

        var codeBaseClassGenerator = new codeClassGen.CodeBaseClassGenerator(migrationClass,
         'Migration');
        codeBaseClassGenerator.generate(codeWriter);
    }

    generateUpBody (codeWriter, tableName, elem) {
        codeWriter.writeLine("Schema::create('" + tableName + "', function (Blueprint $table) {");

        this.generateTableSchema(codeWriter, elem);

        codeWriter.writeLine('});');
    }

    generateDownBody (codeWriter, tableName) {
        codeWriter.writeLine("Schema::dropIfExists('" + tableName + "');");
    }

    getMigrationMethodFromType (columnType) {
        switch (columnType) {
            case "BIGINT": return "bigInteger";
            case "BLOB": return "binary";
            case "BOOLEAN": return "boolean";
            case "CHAR": return "char";
            case "DATE": return "method";
            case "DATETIME": return "dateTime";
            case "DECIMAL": return "decimal";
            case "DOUBLE": return "double";
            case "FLOAT": return "float";
            case "GEOMETRY": return "geometry";
            case "GEOMETRYCOLLECTION": return "geometryCollection";
            case "VARCHAR": return "string";
            case "TEXT": return "text";
            case "INTEGER": return "integer";
            default:
                return null;
        }
    }

    /**
     * Generates table schema based on the 
     * column definition.
     *
     * @param {type.Model} elem
     * @param {string} path
     * @param {Object} options
     */
    generateTableSchema (codeWriter, elem) {
        var columns = elem.model.columns;
        codeWriter.indent();
        for (var i in columns)  {
            var singleColumn = columns[i];
            var columnDefinition = "$table->";
            var type = this.getMigrationMethodFromType(singleColumn.type);
            if (type !== null) {
                var args = "'" + singleColumn.name + "'";
                if (type === "string") {
                    args += (singleColumn.length > 0) ? "," + singleColumn.length : "";
                }

                columnDefinition  += type + "(" + args +")";

                codeWriter.writeLine(columnDefinition);
            }
        }
        codeWriter.outdent();
    }

    /**
     * Generate codes from a given element
     *
     * @param {type.Model} elem
     * @param {string} path
     * @param {Object} options
     */
    generate (elem) {
        var result = new $.Deferred();
        var filePath, codeWriter, file;

        if (elem instanceof type.ERDEntityView) {
            filePath = this.fileManager.getMigrationsFullPath() + '/' + this.generateFileName(elem);

            codeWriter = new codegen.CodeWriter('\t');
            this.generateClassCode(codeWriter, elem);

            fs.writeFileSync(filePath, codeWriter.getData());
        } else {
            result.resolve();
        }

        return result.promise();
    }
}

/**
 * Generate
 * @param {type.Model} baseModel
 * @param {string} basePath
 * @param {Object} options
 */
function generate (baseModel, basePath, options) {
    var fileManager = new fileUtils.FileManager(basePath, options);
    fileManager.prepareMigrationsFolder(
        function () {
            baseModel.ownedViews.forEach(child => {
                var codeGenerator = new LaravelMigrationCodeGenerator(baseModel, fileManager);

                codeGenerator.generate(child);
            });
        }, 
        function () {
            app.dialogs.showErrorDialog("Canceled operation by user.");

            return;
        }
    );
}

exports.generate = generate;