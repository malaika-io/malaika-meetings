const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();

//scss to css
function style() {
    return gulp.src('static/scss/**/*.scss', {sourcemaps: true})
        .pipe(sass({
            outputStyle: 'compressed'
        }).on('error', sass.logError))
        .pipe(autoprefixer('last 2 versions'))
        .pipe(gulp.dest('static/css', {sourcemaps: '.'}))
        .pipe(browserSync.reload({stream: true}));
}

gulp.task('default', style);
