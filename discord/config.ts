let server_port = process.env.PORT || 9000

export default {
    prefix: "!",
    port: server_port,
    token: process.env.DISCORD_TOKEN,
    mongoURI: process.env.MONGO_URI
}