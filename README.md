bltbucket
=========
Don't byte off more than you can chew.


Installation
------------

    # To get MongoDB:
    brew install mongodb

    # To have launchd start MongoDB at login:
    ln -s /usr/local/opt/mongodb/*.plist ~/Library/LaunchAgents/

    # Load MongoDB right now:
    launchctl load -w ~/Library/LaunchAgents/homebrew.mxcl.mongodb.plist


Development
-----------

To start:

    cp settings_local.dist.js settings_local.js

In one tab:

    nodemon web.js

In another tab:

    python -m SimpleAsyncHTTPServer -r . -p 9696

Load [http://localhost:9696](http://localhost:9696)
