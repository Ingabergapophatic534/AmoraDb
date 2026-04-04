{
  "targets": [
    {
      "target_name": "amoradb",
      "sources": [ "./src/native.c" ],
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
