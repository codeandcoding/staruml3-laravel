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
    constructor (classConfiguration, extension, writer) {
        /** @member {string} classConfiguration */
        this.classConfiguration = classConfiguration;

        /** @member {string} extension */
        this.extension = extension || null;

        /** @member {type.CodeWriter} */
        this.writer = writer;
    }

    generate() {
        this.header();
        this.imports();
        this.mainClassCode();
    }

    header() {
        this.writer.writeLine('<?php');
        this.writer.writeLine('');
    }

    imports() {
        for (var i in this.classConfiguration.uses) {
            this.writer.writeLine('use ' + this.classConfiguration.uses[i]);
        }
        this.writer.writeLine('');
    }

    mainClassCode() {
        this.classSignature();
        this.writer.writeLine('{');
        this.writer.indent();
        this.mainClassCodeBody();
        this.writer.outdent();
        this.writer.writeLine('}');
    }

    classSignature() {
        this.writer.writeLine('class ' + this.classConfiguration.name + ' extends ' + this.extension);
    }

    blockDocs(methodMetaData) {
        this.writer.writeLine ('/**');
        this.writer.writeLine (' * ' + methodMetaData.description);
        this.writer.writeLine (' *');
        for (var k in methodMetaData.returnValues) {
            this.writer.writeLine (' * @return ' + methodMetaData.returnValues[k].type);
        }
        this.writer.writeLine ( " */" );
    }

    writeMethod(methodMetaData) {
        let scope = methodMetaData.scope;
        let methodName = methodMetaData.name;

        this.writer.writeLine(scope + ' function ' + methodName +'()');
        this.writer.writeLine('{');
        if (methodMetaData.body === null) {
            this.writer.indent();
            this.writer.writeLine("// Your code goes here...");
            this.writer.outdent();
        } else {
            methodMetaData.body();
        }
        this.writer.writeLine('}');
    }

    mainClassCodeBody() {
        let genClass = this.classConfiguration;

        let methodLength = genClass.methods.length - 1;
        let methodCounter = 0;
        for (var j in genClass.methods) {
            this.blockDocs(genClass.methods[j]);
            this.writeMethod(genClass.methods[j]);

            if (methodCounter < methodLength) this.writer.writeLine('');

            methodCounter++;
        }
    }
}

exports.CodeBaseClassGenerator = CodeBaseClassGenerator;