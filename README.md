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


heifer
------
[Heifer](https://github.com/potch/heifer) calculates your site's weight. Go and compile that:

    go build heifer && ./heifer
