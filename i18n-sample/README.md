# I18n Sample
This is changed from the original sample project to show how to use vscode-nls-dev to generate localization files under the i18n folder

## How to use it
1. Run `gulp build` to generate nls metadata file in `out` directory
2. Run `gulp export-i18n` to get all strings for tanslation
3. Tranlate all the strings in exported xlf files according to the xml format in `sample.xlf`
2. Run `gulp import-i18n` to import all the translations and create the json files in `i18n` directory
