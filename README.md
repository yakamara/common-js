common-js
=========

Sammlung nützlicher jQuery-Plugins (nur selbst erstellte).

Installation
------------

* Composer installieren
* Composer-Asset-Plugin installieren: `composer global require "fxp/composer-asset-plugin:~1.0"`
* `composer.json` anpassen:

```json
{
    "require": {
        "bower-asset/yakamara-common-js": "dev-master"
    },
    "extra": {
        "asset-installer-paths": {
            "bower-asset-library": "web/assets/vendor"
        },
        "asset-repositories": [
            {
                "type": "bower-vcs",
                "url": "https://github.com/yakamara/common-js.git"
            }
        ]
    }
}
```

Plugins
-------

Plugin | Beschreibung
--- | ---
... | ...
