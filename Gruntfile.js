/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    less: {
      development: {
        src: "less/*.less",
        dest: ".tmp/<%= pkg.name %>.css"
      }
    },
    concat: {
    	js: {
        src: [
          'js/libs/jquery-1.11.0.min.js', // make sure it's first
          'js/libs/*.js',
          'js/libs/jquery.mobile/*.min.js',
          'js/api/*.js',
          'js/*.js',
          // make sure we put main.js last
          '!js/main.js',
          'js/main.js',         
        ],
        dest: 'www/js/<%= pkg.name %>.js'
      },
      less: {
        src: [
          'js/libs/jquery.mobile/jquery.mobile-1.4.2.css',
          'less/*.css',
          '.tmp/<%= pkg.name %>.css'	
        ],
        dest: 'www/css/<%= pkg.name %>.css' /* to css so it's replaced */
      }
    },
    autoprefixer: {
      options: {
        browsers: ['> 1%', 'last 2 versions', 'ie 8', 'ie 9', 'ff 17', 'opera 12.1']
      },
      // prefix all specified files and save them separately
      single_file: {
        options: {},
        //        expand: true,
        //        flatten: true,
        src: 'www/css/<%= pkg.name %>.css',
        dest: 'www/css/<%= pkg.name %>.css'
      }
    },
    cssmin: {
      minify: {
        expand: true,
        cwd: 'www/css/',
        src: ['*.css', '!*.min.css'],
        dest: 'www/css/',
        ext: '.min.css'
      }
    },
    uglify: {
      options: {
//        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        mangle: true,
        beautify: false,
        compress: {},
//        report: 'min',
        preserveComments: 'some'
      },
      js: {
        files: {
          'www/js/<%= pkg.name %>.min.js' : ['www/js/<%= pkg.name %>.js']
        }
      },
      /*jslibs: {
        cwd: "js/libs/",
//        src: ['js/libs/*.js', '!js/libs/*.min.js'],  // source files mask
        src: ['*.js', '!*.min.js'],  // source files mask
        dest: 'www/js/libs/',    // destination folder
        expand: true,    // allow dynamic building
        flatten: true,   // remove all unnecessary nesting
        ext: '.min.js'   // replace .js to .min.js
//        files: {
//          'www/js/<%= pkg.name %>.min.js' : ['www/js/<%= pkg.name %>.js']
//        }
      }*/
    },
    jshint: {
      options: {
        globals: {
          jQuery: true,
          $: true,
          console: false,
          d3d: true,
          ConnectAPI: true,
          NetworkAPI: true,
          InfoAPI: true,
          ConfigAPI: true,
          PrinterAPI: true,
          UpdateAPI:true,
          ServerAPI:true,
          addToHomescreen: true
        },
        browser: true,
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: false,
        boss: true,
        eqnull: true
      },
//      gruntfile: {
//        src: 'Gruntfile.js'
//      },
//      lib_test: {
//        src: ['www/js/*.js', '!www/js/<%= pkg.name %>.js', '!www/js/<%= pkg.name %>.min.js']
//      }
      src: ['js/**.js'],
    },
    clean: {
      main: {
        src: "www/css/images"
      }
    },
    copy: {
      main: {
      	expand: true,
        nonull: true,
        cwd: "js/libs/jquery.mobile/images/",
        src: "**",
        dest: "www/css/images/",
        filter: grunt.file.exists
      }
    },
    watch: {
      javascript: {
        files: ["js/**", '!www/js/<%= pkg.name %>.min.js', '!www/js/<%= pkg.name %>.js'],
        tasks: ["jshint", "concat:js", "uglify:js"]
      },
      styles: {
        files: ["less/**"],
        tasks: ["less", "autoprefixer", "concat:less", "cssmin"]
      }
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Default task.
  grunt.registerTask('default', [
		'less',
    'autoprefixer',
    'concat',
    'cssmin',
    'uglify',
    'jshint',
    'clean',
    'copy',
    'watch'
  ]);

};
