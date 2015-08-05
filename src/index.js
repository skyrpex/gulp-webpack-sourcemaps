import path             from 'path';
import webpack          from 'webpack';
import through2         from 'through2';
import tempfile         from 'tempfile';
import deepmerge        from 'deepmerge';
import MemoryFileSystem from 'memory-fs';
import applySourceMap   from 'vinyl-sourcemaps-apply';

const compile = (options = {}) => {

  return through2.obj(function(file, enc, callback) {

    const filename = tempfile('.js');
    const sourcemap = `${filename}.map`;

    let config = deepmerge(options, {
      entry: file.path,
      output: {
        path: path.dirname(filename),
        filename: path.basename(filename),
      },
    });

    const useSourcemaps = file.sourceMap == true;

    if (useSourcemaps) {
      config = deepmerge(config, {
        devtool: 'sourcemap',
        output: {
          sourcemapFilename: path.basename(sourcemap),
          devtoolModuleFilenameTemplate(info) {
            const filename = path.relative(process.cwd(), info.absoluteResourcePath);
            return filename;
          },
        },
      });
    }

    const compiler = webpack(config);
    const fs = compiler.outputFileSystem = new MemoryFileSystem();

    const done = (err, stats) => {

      if (err) {
        this.emit('error', err);
        return;
      }

      if (stats.hasErrors()) {
        stats.compilation.errors.forEach(error => {
          this.emit('error', error);
        });

        if (!options.watch) {
          this.emit('end');
        }

        return;
      }

      if (stats.hasWarnings()) {
        stats.compilation.warnings.forEach(warning => {
          this.emit('warning', error);
        });
      }

      const clone = file.clone();

      const contents = fs.readFileSync(filename);

      clone.contents = contents;
      if (clone.sourceMap && useSourcemaps) {
        const map = fs.readFileSync(sourcemap).toString();
        applySourceMap(clone, map);
      }

      this.push(clone);

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

compile.webpack = webpack;

export default compile;
