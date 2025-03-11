import json from "@rollup/plugin-json"

export default [
  {
    input: 'src/main.js',
    output: [
      {
        file: "dist/main.bundle.js",
        format: "iife",
        banner: 'props;'
      }
    ],
    plugins: [json()]
  },
]
