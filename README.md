# @mzgoddard/jest-webpack

[![Build Status](https://travis-ci.org/mzgoddard/jest-webpack.svg?branch=master)](https://travis-ci.org/mzgoddard/jest-webpack) [![Build status](https://ci.appveyor.com/api/projects/status/g4xvtyepm30hf48i/branch/master?svg=true)](https://ci.appveyor.com/project/mzgoddard/jest-webpack/branch/master)

A helper tool and webpack plugin to integrate jest and webpack.

This project is currently a rough implementation. At this time it can be used by adding the contained JestWebpackPlugin to a webpack config and running webpack with that config. The tool does not yet integrate with jest configuration options or flags.

## How it works?

`jest-webpack` uses a webpack plugin to add related plugins that are responsible for 4 operations.

1. The `TestEntriesPlugin` finds test files that jest will operate on and creates entry chunks for them.
2. The `EntryReferencePlugin` creates additional entries for any other files that are depended on by those test files. These entries return objects pointing to the various transformations of that file. If a css file is depended on by both `css-loader` and `css-loader/locals` for example, both of the outputs of those loaders will be in the same file. Files then depending on those outputs reference the entry chunk and use the exported member for their needed version of the original file.
3. The `EmitChangedAssetsPlugin` removes entry chunks that already exist in the destination folder. It also includes package.json for the tested project.
4. The `RunJestWhenDonePlugin` runs jest when webpack is done. It runs jest from the destination folder so jest uses the webpack transformed files. This lets jest determine what files changed and which runs to test again instead of testing all the files again.

This way of integrating jest and webpack is fairly transparent, requiring little modification to a webpack project. Used along with `source-map-support`, you can also get source maps.
