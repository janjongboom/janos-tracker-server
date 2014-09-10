# Tracker to track phones

* Run this server (`node server.js`)
* Install [janos](http://github.com/janjongboom/janos) on a phone.
* Fill in the address of the server in your local_settings.conf
* `make install-phone` on the phone to set the config file
* Plug in a SIM card or enable WiFi
* Run `tracker.start()` to register
* Go to /location/:deviceId to see the page for the device
