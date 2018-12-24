/* -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- *//*
「記述の中で使われているGulpの処理の解説」

・require("プラグイン名")
使用するプラグインを読み込みます
・gulp.task("タスク名", 実行される処理)
タスク名と、実際に行われる処理を記述します。タスク名をdefaultにすると、タスク実行時のタスク名を省略できます
・gulp.src("取得するファイル")
タスクの対象となるファイルを取得します。複数のファイルも指定できます
・pipe()
一つ一つの処理をつなげます。例えば、src()で取得したStylusファイルをコンパイルし、それをgulp.dest()で書き出します。pipe()メソッドはいくらでもつなげることができるので、連続した複数の処理を実装できます
・gulp.dest("保存先フォルダー")
処理を行ったファイルを指定の場所に保存します

/* -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */

// gulpプラグインの読み込み
let gulp =  require('gulp')
    // pugのコンパイル
    pug = require('gulp-pug')

    // stylusのコンパイル
    stylus = require('gulp-stylus')
    // ベンダープレフィックスの自動付与。
    autoprefixer = require('gulp-autoprefixer')
    // ソースマップ（コンパイルや圧縮が行われたファイルの、元の位置を確認できるようにする仕組み）を出力
    sourcemaps = require('gulp-sourcemaps')
    // cssの圧縮
    cleanCSS = require('gulp-clean-css')

    // javascriptの圧縮
    uglify = require('gulp-uglify')
    // 複数のJSファイルを一つにまとめる
    concat = require("gulp-concat")
    babel = require('gulp-babel')

    // 画像の圧縮
    imagemin = require('gulp-imagemin')
    // pngの圧縮
    pngquant = require("imagemin-pngquant")
    // jpegの圧縮
    mozjpeg = require('imagemin-mozjpeg')

    // gulp実行時にブラウザを立ち上げる。
    browserSync = require('browser-sync')
    // エラーでgulpが止まるのを防ぐ
    plumber = require('gulp-plumber')
    // エラーのリアルタイム通知
    notify = require("gulp-notify")
    // gulpのキャッシュ
    cache = require('gulp-cached')
    // こちらもキャッシュ機能。cachedとの違いは前者がストリームをメモリにキャッシュして、後者はファイル比較をしているということだと思われる。
    changed = require('gulp-changed')
    // if文を使えるようにする。
    gulpif = require('gulp-if')
    // ファイルをインライン呼び出しすることができるプラグインです。今回はCSSやJSのインライン呼び出しを実現している。
    // 他にも色々な使い方ができるみたいなので、興味ある人は調べて見ること
    // https://www.npmjs.com/package/gulp-file-include
    fileinclude = require('gulp-file-include')
    // コマンドにオプションを指定する。
    yargs = require('yargs').argv;


// 開発用ディレクトリの指定
let src = {
  'html': ['./src/pug/pages/**/*.pug'], //, '!' + './src/pug/**/_*.pug'],
  'styles': ['./src/stylus/styles.styl'],
  'images': ['./src/**/*.+(jpg|jpeg|png|gif|svg|ico)'],
  'js': './src/js/**/*.js',
  'other': './src/other/**/*'
}

// 出力ディレクトリの指定
let dest = {
  'root': './dist/'
}

let isProduction = (yargs.env === 'production') ? true : false;
let environment = (yargs.env === 'production') ? 'production' : 'development';
let inlining = (yargs.inline === 'true') ? true : false;

gulp.task('environment', () =>  {
  console.log(environment);
});

// pugのコンパイルなど
gulp.task('html', () =>  {

  // pugファイルの読み込み
  return gulp.src(src.html)

    // pugファイルが増えてきて、コンパイル速度が落ちてきたら、以下の行のコメントアウトを外すべし。ただし、注意書き（このファイルの上部に記載）を読んで注意すること。
    // .pipe(cache('html'))

    // 別途 Watchタスク（一番下の方）からこのタスクを呼んだ時に、ビルドエラーで Watch タスクを終了させないようにしている。
    .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))

    // pugのコンパイル
    .pipe(pug({

      // Pugファイルのルートディレクトリを指定。
      // `/_includes/_layout`のようにルート相対パスで指定することができる。
      basedir: 'src/pug/pages',
      locals: {
        environment: environment,
        inlining: inlining
      },

      // Pugファイルの整形。圧縮する場合はfalse
      pretty: !isProduction
    }))

    .pipe(fileinclude({
      prefix: '@@',
      basepath: dest.root
    }))

    // ディレクトリへの出力
    .pipe(gulp.dest(dest.root))

    // ブラウザの更新
    .pipe(browserSync.reload({stream: true}))
})

let env = environment;
// stylusのコンパイルなど
gulp.task('styles', () =>  {
  return gulp.src(src.styles)
    // キャッシュ。ファイルが多くなってきて、コンパイル速度が落ちてきたら、ON
    // .pipe(cache('styles'))

    .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))

    // ソースマップを書き出す準備
    .pipe(gulpif(!isProduction, sourcemaps.init()))

    .pipe(stylus({define:{env}}))

    // ソースマップの書き出し
    .pipe(gulpif(!isProduction, sourcemaps.write()))

    // ベンダープレフィックスの自動付与と各ブラウザ固有の書き方の追記
    .pipe(autoprefixer({
      // ベンダープレフィックス自動付与の対象ブラウザ。この場合は各ブラウザの最新2バージョンのまでを対象。
      browsers: ['last 2 version'],
      grid: true
    }))
    // cssの圧縮を(trueで)有効化
    .pipe(gulpif(isProduction, cleanCSS()))
    // ソースマップの書き出し
    .pipe(gulp.dest(dest.root+'css/'))
    .pipe(browserSync.reload({stream: true}))
})

// javascriptの圧縮
gulp.task('javascript', () => {
  return gulp.src(src.js)
    .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))

    .pipe(babel())
    // JSの圧縮
    .pipe(gulpif(isProduction, uglify()))
    // 全てのJSファイルをscriptファイル一つにまとめる。
    .pipe(concat('script.js'))
    .pipe(gulp.dest(dest.root +'js/'))
    .pipe(browserSync.reload({stream: true}))
})

// 画像の圧縮
gulp.task('imagemin', () => {
  return gulp.src(src.images)

    // 変更・追加されたファイルだけを圧縮&出力
    .pipe(changed(dest.root))
    .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
    .pipe(imagemin(
      [
        // pngの圧縮
        pngquant({

          // 圧縮率の指定
          quality: '65-80',

          // 圧縮スピードの指定。1が一番遅いが、圧縮率が高い。
          speed: 1,

          // ディザ処理をOFF。画像の圧縮方式。
          floyd:0
        }),

        // pngquantでpng画像が暗くなってしまうバグを防ぐ
        imagemin.optipng(),

        // jpgの圧縮
        mozjpeg({
          quality:85,

          // プログレッシブjpegの設定。画像圧縮方式JPEG形式の拡張仕様の1種。
          progressive: true
        }),

        // svgの圧縮
        imagemin.svgo(),

        // gifの圧縮
        imagemin.gifsicle()
      ]
    ))
    .pipe(gulp.dest(dest.root))
    .pipe(browserSync.reload({stream: true}))
})

// その他ファイルのコピータスク
gulp.task('copy-other', () => {
  return gulp.src(src.other)
    .pipe(gulp.dest(dest.root))
    .pipe(browserSync.reload({stream: true}))
})

// gulp実行時にサーバーを立ち上げ、デフォルトブラウザの新しいタブでWebページを表示する。
gulp.task('browser-sync', () =>  {
  browserSync({
    server: {
      baseDir: dest.root,
      index: 'index.html'
    }
  })
})

// gulp実行時に発火させるタスクと、ファイルの監視の設定
gulp.task('default', gulp.series(gulp.parallel('html','styles','javascript','imagemin','copy-other','browser-sync')), () =>  {
  gulp.watch('./src/**/*.pug', gulp.series('html'))
  gulp.watch('./src/stylus/**/*.styl', gulp.series('styles'))
  gulp.watch('./src/js/**/*.js', gulp.series('javascript'))
  gulp.watch('./src/img/**/*.+(jpg|jpeg|png|gif|svg|ico)', gulp.series('imagemin'))
  gulp.watch('./src/other/**/*', gulp.series('copy-other'))
})

// ビルドタスクの設定。gulp buildを実行した時。
gulp.task('build', gulp.series(gulp.parallel('html','styles','javascript','imagemin','copy-other')))
