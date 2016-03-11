{
	"targets": [{
		"target_name": "addon",
		"sources": ["src/addon.cc" ],
        'include_dirs': [
          '.',
        ],
        "include_dirs" : [
	 			"<!(node -e \"require('nan')\")"
		],
		"conditions": [
			['OS=="linux"', {
				"libraries": [
					"<(module_root_dir)/build/Release/libembed.so"
				]
			}],
			['OS=="mac"', {
				"libraries": [
					"../build/Release/libembed.dylib"
				]
			}],
			['OS=="win"', {
				"libraries": [
					"../build/Release/embed.dll.lib"
				]
			}]
		]
	}]
}
