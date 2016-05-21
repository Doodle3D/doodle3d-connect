# doodle3d-connect
The Doodle3D connect system allows users / applications to find their Doolde3D WiFi-Box(es) on the same WiFi network. The benefit over other systems is that this doesn't require an application with Bonjour-like support, it can be used by a website using Javascript. Visit http://connect.doodle3d.com to scan your local network for Doodle3D WiFi-Boxes.

The following image shows a typical doodle3d-connect page. The most common way to get here is:

1. with an active internet connection visit http://connect.doodle3d.com
2. connect to a Doodle3D-123456 WiFi accesspoint.
3. wait a couple of seconds. Your WiFi-Box should appear in the list.

![connect.doodle3d.com](https://cloud.githubusercontent.com/assets/156066/15451030/645fd5ae-1fb0-11e6-9521-e2271c1d2bc5.png)

#Server
![Diagram of doodle3d-connect](https://cloud.githubusercontent.com/assets/156066/15450961/519baea0-1fad-11e6-9b58-9ca597db0a55.png)
The Doodle3D connect server has an api with 2 methods:

##list

Retrieve a list of connected WiFi-Boxes that are on the same remote IP and that signed-in less than an hour ago. The remote IP is the IP adres you're behind on the internet. Usually when you're on a network all devices on that network have the same remote IP. It returns the following information per WiFi-Box:

id: The unique identifier per box, which is a combination of it's remote IP and local IP.
remoteip: The remote IP of the box.
localip: The local IP of the box. (Web)App's can access WiFi-Boxes behind this IP.
wifiboxid: The human readable identifier, that is usually displayed to the user.
hidden: This is planned feature. When a box is hidden the connect interface can hide the box and have users enter the wifiboxid before it releases the information.
data: Sign-in date.
Current url: http://connect.doodle3d.com/api/list.php
Example url: http://connect.doodle3d.com/api/list.example

##signin

Used to sign-in into the connect system. Requires:

localip: The local IP of the WiFi-Box on the local network.
wifiboxid: A custom human readable name to identify the WiFi-Box.
From the request it will determine the remote IP and the date. This request will also remove sign-ins from more than an hour ago. 

#WiFi-Box
The WiFi-Box will perform a scan for WiFi networks, when a known network is available it will join this network. When no known network is found it will become a access point. This means a fresh WiFi-Box will always become a access point.
When a WiFi network is joined the WiFi-Box will attempt to Sign-in, when this fails it will retry a couple of times. From then on it will attempt a sign-in every 15 minutes. It also attempt a sign-in when the wifibox id is changed.

The WiFi-Box has a couple of API methods required for the connect system:

network/alive. A very simple method that doesn't contain any logic or info. It's just something (Web)App's can query to check whether there is something behind a local IP adres. Similar to a ping.

#(Web)App
(Web)Apps can use the connect system to find WiFi-Boxes on the same network.
They continuely query the list api method to retrieve local WiFi-Boxes information. Because the server can't know their current status the (Wep)App should query the alive api method of the WiFi-Boxes. When it get's a valid response the WiFi-Box can be shown to the user. Besides querying the boxes it retrieves through the list api The Web(App) should also continuesly query the alive method of boxes that are already shown. To make this easier for (Wep)App developers we created a JavaScript library that handles this; ConnectAPI.js.
