# Gulp Less Watcher

Wraps Webpack into a streaming interface (and generates sourcemaps).

## Usage

```bash
npm install gulp-webpack-sourcemaps --save-dev
```

```javascript
import gulp        from 'gulp';
import loadPlugins from 'gulp-load-plugins';

const $ = loadPlugins();
const config = {
  // Enable watch mode
  watch: true,
  // Other Webpack config...
};

// We can safely use read: false
return gulp.src('main.less', { cwd: 'resources/assets/styles/', read: false, })
  .pipe($.sourcemaps.init()) // Enable sourcemaps
  .pipe($.webpackSourcemaps(config))
  .pipe($.sourcemaps.write('./', { includeContent: true }))
  .pipe(gulp.dest('public/assets/'));
```
