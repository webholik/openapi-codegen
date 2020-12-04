const fs = require('fs');
const processor = require('./local');
const yaml = require('yaml');
const admzip = require('adm-zip');

function getList() {
    let list = []
    fs.readdirSync('./configs').forEach(file => {
        list.push(file.split('.').slice(0, -1).join('.'))
    })

    console.log(list);
}
function generate(openapi, lang) {
    const spec = yaml.parse(openapi, {prettyErrors: true});
    const config = JSON.parse(fs.readFileSync(`./configs/${lang}.json`, 'utf-8'));
    let data;

    // The parse somewhere checks if the source is remote or not
    // so we need to provide a name which does not look like a url
    config.defaults.source = 'swagger.yaml';
    let zipFiles = {};
    const zipFile = (filename, contents, encoding) => {
        zipFiles[filename] = contents;
    }
    const nop = (arg, callback) => { if (callback) callback(null, true); return true; }

    processor.fileFunctions.createFile = zipFile;
    processor.fileFunctions.rimraf = nop;
    processor.fileFunctions.mkdirp = nop;
    processor.fileFunctions.mkdirp.sync = nop;

    processor.main(spec, config, lang, function () {
        var zip = new admzip();

        // add files directly
        for (let f in zipFiles) {
            zip.addFile(f, new Buffer(zipFiles[f]), 'Created with OpenAPI-CodeGen');
        }

        data = zip.toBuffer();
    });
    return data;
}

module.exports = {
    'generate': generate,
    'getList': getList,
}







