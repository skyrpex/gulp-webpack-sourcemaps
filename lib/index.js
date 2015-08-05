'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _through2 = require('through2');

var _through22 = _interopRequireDefault(_through2);

var _tempfile = require('tempfile');

var _tempfile2 = _interopRequireDefault(_tempfile);

var _deepmerge = require('deepmerge');

var _deepmerge2 = _interopRequireDefault(_deepmerge);

var _memoryFs = require('memory-fs');

var _memoryFs2 = _interopRequireDefault(_memoryFs);

var _vinylSourcemapsApply = require('vinyl-sourcemaps-apply');

var _vinylSourcemapsApply2 = _interopRequireDefault(_vinylSourcemapsApply);

var compile = function compile() {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  return _through22['default'].obj(function (file, enc, callback) {
    var _this = this;

    var filename = (0, _tempfile2['default'])('.js');
    var sourcemap = filename + '.map';

    var config = (0, _deepmerge2['default'])(options, {
      entry: file.path,
      output: {
        path: _path2['default'].dirname(filename),
        filename: _path2['default'].basename(filename)
      }
    });

    var useSourcemaps = file.sourceMap == true;

    if (useSourcemaps) {
      config = (0, _deepmerge2['default'])(config, {
        devtool: 'sourcemap',
        output: {
          sourcemapFilename: _path2['default'].basename(sourcemap),
          devtoolModuleFilenameTemplate: function devtoolModuleFilenameTemplate(info) {
            var filename = _path2['default'].relative(process.cwd(), info.absoluteResourcePath);
            return filename;
          }
        }
      });
    }

    var compiler = (0, _webpack2['default'])(config);
    var fs = compiler.outputFileSystem = new _memoryFs2['default']();

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

      var clone = file.clone();

      var contents = fs.readFileSync(filename);

      clone.contents = contents;
      if (clone.sourceMap && useSourcemaps) {
        var map = fs.readFileSync(sourcemap).toString();
        (0, _vinylSourcemapsApply2['default'])(clone, map);
      }

      _this.push(clone);

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

compile.webpack = _webpack2['default'];

exports['default'] = compile;
module.exports = exports['default'];