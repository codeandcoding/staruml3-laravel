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
const codegen = require('../utils/codegen-utils');
const fileUtils = require('../utils/file-utils');
const codeClassGen = require('../code-class-generator');
const classGenerator = require('../class-generator');

/**
 *  Code Generator
 */
class MigrationCodeGenerator {

    /**
     * @constructor
     *
     * @param {type.UMLPackage} baseModel
     * @param {type.FileManager}
     * @param {type.CodeWriter}
     */
    constructor (baseModel, fileManager, writer) {
        /** @member {type.Model} */
        this.baseModel = baseModel;

        /** @member {type.FileManager} */
        this.fileManager = fileManager;

        /** @member {type.CodeWriter} */
        this.writer = writer;
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
        let now = new Date();
        let terms = [];
        let extension = '.php';
        let tableName = elem.model.name;

        terms.push(now.getFullYear());
        terms.push(('0' + (now.getMonth() + 1)).slice(-2));
        terms.push(('0' + now.getDate()).slice(-2));
        let time = ('0' + now.getHours()).slice(-2) +
            ('0' + now.getMinutes()).slice(-2) +
            ('0' + now.getSeconds()).slice(-2);
        terms.push(time);
        terms.push('create');
        terms.push(tableName);
        terms.push('table');

        return terms.join('_') + extension;
    }

    /**
     * Generates the main code of the class
     *
     * @param elem
     */
    generateClassCode(elem) {
        let tableName = elem.model.name;
        var classCodeGenerator = this;

        let className = 'Create' + (tableName.charAt(0).toUpperCase() + tableName.slice(1))  + 'Table';

        let classGenerator = classGenerator.ClassGenerator(className);
        classGenerator.addImport('Illuminate\\Support\\Facades\\Schema;');
        classGenerator.addImport('Illuminate\\Database\\Schema\\Blueprint;');
        classGenerator.addImport('Illuminate\\Database\\Migrations\\Migration;');
        classGenerator.addExtend('Migration');

        let upMethodGenerator = classGenerator.ClassMethodGenerator('up', 'public', 'Run the migrations.');
        upMethodGenerator.addReturn({ "type": "void" });
        upMethodGenerator.setBody(function () {
            classCodeGenerator.generateUpBody(tableName, elem);
        });

        let downMethodGenerator = classGenerator.ClassMethodGenerator('down', 'public', 'Reverse the migrations.');
        downMethodGenerator.addReturn({ "type": "void" });
        downMethodGenerator.setBody(function () {
            classCodeGenerator.generateDownBody(tableName);
        });

        classGenerator.addMethodGenerator(upMethodGenerator);
        classGenerator.addMethodGenerator(downMethodGenerator);

        (new codeClassGen.CodeBaseClassGenerator(classGenerator, this.writer)).generate();
    }

    generateUpBody (tableName, elem) {
        this.writer.indent();

        this.writer.writeLine("Schema::create('" + tableName + "', function (Blueprint $table) {");
        this.generateTableSchema(elem);
        this.writer.writeLine('});');

        this.writer.outdent();
    }

    generateDownBody (tableName) {
        this.writer.indent();

        this.writer.writeLine("Schema::dropIfExists('" + tableName + "');");

        this.writer.outdent();
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
     */
    generateTableSchema (elem) {
        let columns = elem.model.columns;

        this.writer.indent();

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

                this.writer.writeLine(columnDefinition);
            }
        }

        this.writer.outdent();
    }

    /**
     * Generate codes from a given element
     *
     * @param {type.Model} elem
     * @param {string} path
     * @param {Object} options
     */
    generate (elem) {
        let result = new $.Deferred();
        let filePath;

        if (elem instanceof type.ERDEntityView) {
            this.generateClassCode(elem);

            filePath = this.fileManager.getMigrationsFullPath() + '/' + this.generateFileName(elem);
            fs.writeFileSync(filePath, this.writer.getData());
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
                let writer = new codegen.CodeWriter('\t');
                let codeGenerator = new MigrationCodeGenerator(baseModel, fileManager, writer);

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