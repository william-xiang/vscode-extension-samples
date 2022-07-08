/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const gulp = require('gulp');
const path = require('path');

const ts = require('gulp-typescript');
const typescript = require('typescript');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const runSequence = require('run-sequence');
const es = require('event-stream');
const vsce = require('vsce');
const nls = require('vscode-nls-dev');

const tsProject = ts.createProject('./tsconfig.json', { typescript });

const inlineMap = true;
const inlineSource = false;
const outDest = 'out';

const languages = [{ folderName: 'jpn', id: 'ja' }, { folderName: 'fr', id: 'fr' }];

const cleanTask = function() {
	return del(['out/**', 'package.nls.*.json', 'i18n-sample*.vsix']);
}

const internalCompileTask = function() {
	return doCompile(false);
};

const internalNlsCompileTask = function() {
	return doCompile(true);
};

const addI18nTask = function() {
	return gulp.src(['package.nls.json'])
		.pipe(nls.createAdditionalLanguageFiles(languages, 'i18n'))
		.pipe(gulp.dest('.'));
};

const buildTask = gulp.series(cleanTask, internalNlsCompileTask, addI18nTask);

const doCompile = function (buildNls) {
	var r = tsProject.src()
		.pipe(sourcemaps.init())
		.pipe(tsProject()).js
		.pipe(buildNls ? nls.rewriteLocalizeCalls() : es.through())
		.pipe(buildNls ? nls.createAdditionalLanguageFiles(languages, 'i18n', 'out') : es.through())
		.pipe(buildNls ? nls.bundleMetaDataFiles('i18n-sample', 'out') : es.through())
		.pipe(buildNls ? nls.bundleLanguageFiles() : es.through())

	if (inlineMap && inlineSource) {
		r = r.pipe(sourcemaps.write());
	} else {
		r = r.pipe(sourcemaps.write("../out", {
			// no inlined source
			includeContent: inlineSource,
			// Return relative source map root directories per file.
			sourceRoot: "../src"
		}));
	}

	return r.pipe(gulp.dest(outDest));
}

const vscePublishTask = function() {
	return vsce.publish();
};

const vscePackageTask = function() {
	return vsce.createVSIX();
};

// export the strings to be translated from these files
gulp.task('export-i18n', function() {
	return gulp.src(['package.nls.json', 'out/nls.metadata.header.json', 'out/nls.metadata.json'])
		.pipe(nls.createXlfFiles("vscode-extensions", "i18n-sample"))
		.pipe(gulp.dest(path.join('vscode-translations-export')));
})

// After translating the strings in the exported xlf files, 
gulp.task('import-i18n', () => {
	return es.merge(languages.map(language => {
		// console.log(language.folderName)
		return gulp.src(["/Users/william/vscode/vscode-extension-samples-forked/i18n-sample/vscode-translations-export/vscode-extensions/i18n-sample.xlf"])
			.pipe(nls.prepareJsonFiles())
			.pipe(gulp.dest(path.join('./i18n', language.folderName)));
	}));
});


gulp.task('default', buildTask);

gulp.task('clean', cleanTask);

gulp.task('compile', gulp.series(cleanTask, internalCompileTask));

gulp.task('compileNLS', gulp.series(cleanTask, internalNlsCompileTask));

gulp.task('build', buildTask);

gulp.task('publish', gulp.series(buildTask, vscePublishTask));

gulp.task('package', gulp.series(buildTask, vscePackageTask));