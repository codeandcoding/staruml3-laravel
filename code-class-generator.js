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

/**
 * CodeWriter
 */
class CodeBaseClassGenerator {
    /**
     * @constructor
     */
    constructor (classConfiguration, extension) {
        /** @member {string} classConfiguration */
        this.classConfiguration = classConfiguration;

        /** @member {string} extension */
        this.extension = extension || null;
    }

    writeImports(codeWriter) {
        for (var i in this.classConfiguration.uses) {
            codeWriter.writeLine('use ' + this.classConfiguration.uses[i]);
        }
        codeWriter.writeLine();
    }

    writeClassSignature(codeWriter) {
        codeWriter.writeLine('class ' + this.classConfiguration.name + ' extends ' + this.extension);
    }

    writeClass(codeWriter, classBodyWriter) {
        this.writeClassSignature(codeWriter);
        codeWriter.writeLine('{');
        codeWriter.indent();

            classBodyWriter(codeWriter, 
                this.classConfiguration,
                this.writeBlockDocs,
                this.writeMethod);    

        codeWriter.outdent();
        codeWriter.writeLine('}'); 
    }

    writeBlockDocs(codeWriter, methodMetaData) {
        codeWriter.writeLine ('/**');
        codeWriter.writeLine (' * ' + methodMetaData.description);
        codeWriter.writeLine (' *');
        for (var k in methodMetaData.returnValues) {
            codeWriter.writeLine (' * @return ' + methodMetaData.returnValues[k].type);
        }
        codeWriter.writeLine ( " */" );
    }

    writeMethod(codeWriter, methodMetaData) {
        var description = methodMetaData.description;
        var scope = methodMetaData.scope;
        var methodName = methodMetaData.name;

        codeWriter.writeLine(scope + ' function ' + methodName +'()');
        codeWriter.writeLine('{');
        if (methodMetaData.body === null) {
            codeWriter.indent();
            codeWriter.writeLine("// Your code goes here...");
            codeWriter.outdent();
        } else {
            methodMetaData.body(codeWriter);
        }
        codeWriter.writeLine('}');
    }

    writeClassBody(codeWriter, classConfiguration, blockDocsWriter, methodWriter) {
        var genClass = classConfiguration;

        var methodLength = genClass.methods.length - 1;
        var methodCounter = 0;
        for (var j in genClass.methods) {
            blockDocsWriter(codeWriter, genClass.methods[j]);
            methodWriter(codeWriter, genClass.methods[j]);

            if (methodCounter < methodLength) codeWriter.writeLine();

            methodCounter++;
        }
    }

    writeHeader(codeWriter) {
        codeWriter.writeLine('<?php');
        codeWriter.writeLine();
    }

    generate(codeWriter) {     
        this.writeHeader(codeWriter);
        this.writeImports(codeWriter);
        this.writeClass(codeWriter, this.writeClassBody);
    }
}

exports.CodeBaseClassGenerator = CodeBaseClassGenerator;