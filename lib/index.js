'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _vinyl = require('vinyl');

var _vinyl2 = _interopRequireDefault(_vinyl);

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _tempfile = require('tempfile');

var _tempfile2 = _interopRequireDefault(_tempfile);

var _deepmerge = require('deepmerge');

var _deepmerge2 = _interopRequireDefault(_deepmerge);

var _memoryFs = require('memory-fs');

var _memoryFs2 = _interopRequireDefault(_memoryFs);

var _vinylSourcemapsApply = require('vinyl-sourcemaps-apply');

var _vinylSourcemapsApply2 = _interopRequireDefault(_vinylSourcemapsApply);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var compile = function compile(options) {

  return _through2.default.obj(function (file, enc, callback) {
    var _this = this;

    var filename = _path2.default.basename(file.path);

    var config = (0, _deepmerge2.default)(options, {
      entry: file.path,
      output: {
        filename: filename,
        path: '/'
      }
    });

    var useSourcemaps = file.sourceMap != null;

    if (useSourcemaps) {
      config = (0, _deepmerge2.default)(config, {
        devtool: 'sourcemap',
        output: {
          devtoolModuleFilenameTemplate: function devtoolModuleFilenameTemplate(info) {
            var filename = _path2.default.relative(process.cwd(), info.absoluteResourcePath);
            return filename;
          }
        }
      });
    }

    var compiler = (0, _webpack2.default)(config);
    var fs = compiler.outputFileSystem = new _memoryFs2.default();

    var done = function done(err, stats) {

      if (err) {
        _this.emit('error', err);
        return;
      }

      if (stats.hasErrors()) {
        stats.compilation.errors.forEach(function (error) {
          _this.emit('error', error);
        });

        if (!options.watch) {
          _this.emit('end');
        }

        return;
      }

      if (stats.hasWarnings()) {
        stats.compilation.warnings.forEach(function (warning) {
          _this.emit('warning', error);
        });
      }

      // console.log(fs.readdirSync('/'));

      fs.readdirSync('/').filter(function (filename) {
        return !filename.match(/\.(map|js)$/);
      }).forEach(function (filename) {
        // console.log(filename);

        _this.push(new _vinyl2.default({
          // cwd: "/",
          // base: "/test/",
          // path: "/test/file.coffee",
          // contents: new Buffer("test = 123")
          path: filename,
          contents: fs.readFileSync('/' + filename)
        }));
      });

      // Push main file
      var clone = file.clone();
      var contents = fs.readFileSync('/' + filename);
      clone.contents = contents;
      if (clone.sourceMap && useSourcemaps) {
        var map = fs.readFileSync('/' + filename + '.map').toString();
        (0, _vinylSourcemapsApply2.default)(clone, map);
      }

      _this.push(clone);

      // End
      if (!options.watch) {
        callback();
      }
    };

    if (options.watch) {
      compiler.watch({}, done);
    } else {
      compiler.run(done);
    }
  });
};

compile.webpack = _webpack2.default;

exports.default = compile;
module.exports = exports['default'];