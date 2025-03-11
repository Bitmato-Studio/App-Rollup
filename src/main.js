import "./lib/proxyTypes"

import config_props from "../props/props.json"

app.configure(config_props)

if (world.isClient) {
    /** @type {PlayerProxy} Player */
    let player = world.getPlayer();
} 

if (world.isServer) {
    
}