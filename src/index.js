import path             from 'path';
import File             from 'vinyl';
import webpack          from 'webpack';
import through2         from 'through2';
import tempfile         from 'tempfile';
import deepmerge        from 'deepmerge';
import MemoryFileSystem from 'memory-fs';
import applySourceMap   from 'vinyl-sourcemaps-apply';

const compile = (options) => {

  return through2.obj(function(file, enc, callback) {

    const filename = path.basename(file.path);

    let config = deepmerge(options, {
      entry: file.path,
      output: {
        filename,
        path: '/',
      },
    });

    const useSourcemaps = file.sourceMap != null;

    if (useSourcemaps) {
      config = deepmerge(config, {
        devtool: 'sourcemap',
        output: {
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
          this.emit('warning', warning);
        });
      }

      // console.log(fs.readdirSync('/'));

      fs.readdirSync('/')
        .filter(filename => !filename.match(/\.(map|js)$/))
        .forEach(filename => {
          // console.log(filename);

          this.push(new File({
            // cwd: "/",
            // base: "/test/",
            // path: "/test/file.coffee",
            // contents: new Buffer("test = 123")
            path: filename,
            contents: fs.readFileSync(`/${filename}`),
          }));
        });

      // Push main file
      const clone = file.clone();
      const contents = fs.readFileSync(`/${filename}`);
      clone.contents = contents;
      if (clone.sourceMap && useSourcemaps) {
        const map = fs.readFileSync(`/${filename}.map`).toString();
        applySourceMap(clone, map);
      }

      this.push(clone);

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

compile.webpack = webpack;

export default compile;
