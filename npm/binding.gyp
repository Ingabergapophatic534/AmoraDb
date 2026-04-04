{
  "targets": [
    {
      "target_name": "amoradb",
      "sources": [ "./src/native.c" ],
      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": ["-fno-rtti", "-fno-exceptions"],
      "conditions": [
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "Optimization": "Full",
              "FavorSizeOrSpeed": "1"
            }
          }
        }]
      ]
    }
  ]
}
